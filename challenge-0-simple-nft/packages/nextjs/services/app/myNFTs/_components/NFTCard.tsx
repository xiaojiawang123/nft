
import { useState, useEffect } from "react";
import { Collectible } from "./MyHoldings";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [transferToAddress, setTransferToAddress] = useState("");
  const [isListed, setIsListed] = useState(false);
  const [price, setPrice] = useState<string>(""); // 上架价格 (ETH)
  const [auctionPrice, setAuctionPrice] = useState<string>(""); // 拍卖起拍价 (ETH)
  const [auctionEndTime, setAuctionEndTime] = useState<string>(""); // 拍卖结束时间
  const [isAuctionActive, setIsAuctionActive] = useState(false); // 当前拍卖是否活跃
  const [isAuctionStarted, setIsAuctionStarted] = useState(false); // 是否发起过拍卖
  const [loading, setLoading] = useState(true); // 数据加载状态
  const [isAuctionModalOpen, setAuctionModalOpen] = useState(false); // 控制拍卖模态框
  const [isListModalOpen, setListModalOpen] = useState(false); // 控制上架模态框

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { data: nftItem } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getNftItem",
    args: [BigInt(nft.id.toString())],
    watch: true,
  });

  // 读取拍卖信息
  const { data: auctionInfo } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "auctions", // 使用映射 getter
    args: [BigInt(nft.id.toString())],
    watch: true,
  });

  useEffect(() => {
    if (nftItem) {
      setIsListed(nftItem.isListed as boolean);
      setPrice(BigInt(nftItem.price).toString());
    } else {
      setIsListed(false);
      setPrice("");
    }

    if (auctionInfo) {
      setIsAuctionActive(auctionInfo.active); // 使用 isActive 字段
      setIsAuctionStarted(auctionInfo.startTime > 0); // 判断是否已经发起过拍卖
    } else {
      setIsAuctionActive(false);
      setIsAuctionStarted(false);
    }

    setLoading(false); // 数据加载完成
  }, [nftItem, auctionInfo]);

  const handleListNFT = async () => {
    console.log("上架 NFT:", nft.id);
    console.log("价格:", price);
    const priceWei = parseEther(price); // 将 ETH 转换为 wei
    console.log("价格 (wei):", priceWei);

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      alert("请输入有效的价格（ETH）");
      return;
    }

    const listingPrice = await yourCollectibleContract?.read.calculateListingFee([BigInt(priceWei)]);
    console.log("上架费用 (wei):", listingPrice);

    try {
      await writeContractAsync({
        functionName: "placeNftOnSale",
        args: [BigInt(nft.id.toString()), priceWei],
        value: listingPrice,
      });
    } catch (err) {
      console.error("Error calling placeNftOnSale function");
    }
  };

  const handleUnlistNFT = async () => {
    console.log("下架 NFT:", nft.id);
    try {
      await writeContractAsync({
        functionName: "unlistNft",
        args: [BigInt(nft.id.toString())],
      });
    } catch (err) {
      console.error("Error calling unlistNft function");
    }
  };

  const handleStartAuction = async () => {
    console.log("发起拍卖:", nft.id);
    console.log("起拍价格 (ETH):", auctionPrice);
    console.log("拍卖结束时间:", auctionEndTime);

    if (!auctionPrice || isNaN(Number(auctionPrice)) || Number(auctionPrice) <= 0) {
      alert("请输入有效的起拍价格（ETH）");
      return;
    }

    if (!auctionEndTime) {
      alert("请选择有效的拍卖结束时间");
      return;
    }

    const auctionPriceWei = parseEther(auctionPrice);
    const auctionEndTimeStamp = new Date(auctionEndTime).getTime() / 1000; // 转换为 Unix 时间戳

    try {
      await writeContractAsync({
        functionName: "createAuction",
        args: [BigInt(nft.id.toString()), auctionPriceWei, BigInt(auctionEndTimeStamp)],
      });
      setIsAuctionActive(true);
      setIsAuctionStarted(true); // 更新状态为已发起
    } catch (err) {
      console.error("Error calling createAuction function:", err);
    }
  };

  const handleEndAuction = async () => {
    console.log("结束拍卖:", nft.id);
    try {
      await writeContractAsync({
        functionName: "endAuction",
        args: [BigInt(nft.id.toString())],
      });
      setIsAuctionActive(false);
      setIsAuctionStarted(false); // 允许重新发起拍卖
    } catch (err) {
      console.error("Error calling endAuction function:", err);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
      <figure className="relative">
        <img src={nft.image} alt="NFT Image" className="h-60 min-w-full object-cover rounded-xl" />
        <figcaption className="absolute bottom-4 left-4 p-4 bg-black bg-opacity-50 rounded-lg">
          <span className="text-white font-semibold"># {nft.id}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <p className="text-xl font-semibold">{nft.name}</p>
        <p className="my-0 text-lg text-gray-600">{nft.description}</p>
        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold">Owner:</span>
          <Address address={nft.owner as `0x${string}`} />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between mt-4">
          <button
            className="btn btn-primary btn-sm w-1/2"
            onClick={() => setAuctionModalOpen(true)}
          >
            发起拍卖
          </button>
          <button
            className="btn btn-primary btn-sm w-1/2"
            onClick={() => setListModalOpen(true)}
          >
            上架
          </button>
        </div>
      </div>

      {/* 拍卖模态框 */}
      {isAuctionModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] max-w-lg relative">
            <button
              onClick={() => setAuctionModalOpen(false)}
              className="absolute top-2 right-2 text-xl font-bold text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
            <h3 className="text-xl font-semibold mb-4">发起拍卖</h3>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-lg font-semibold">起拍价格 (ETH):</span>
              <input
                type="text"
                value={auctionPrice}
                onChange={(e) => setAuctionPrice(e.target.value)}
                className="input input-xs rounded-lg shadow-sm w-full px-3 py-2 border border-gray-300"
                placeholder="请输入起拍价"
              />
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-lg font-semibold">拍卖结束时间:</span>
              <input
                type="datetime-local"
                value={auctionEndTime}
                onChange={(e) => setAuctionEndTime(e.target.value)}
                className="input input-xs rounded-lg shadow-sm w-full px-3 py-2 border border-gray-300"
              />
            </div>
            <div className="flex space-x-2">
              <button
                className="btn btn-primary btn-sm w-full"
                onClick={handleStartAuction}
              >
                发起拍卖
              </button>
             
            </div>
          </div>
        </div>
      )}

      {/* 上架模态框 */}
      {isListModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] max-w-lg relative">
            <button
              onClick={() => setListModalOpen(false)}
              className="absolute top-2 right-2 text-xl font-bold text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
            <h3 className="text-xl font-semibold mb-4">上架NFT</h3>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-lg font-semibold">价格 (ETH):</span>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input input-xs rounded-lg shadow-sm w-full px-3 py-2 border border-gray-300"
                placeholder="请输入价格"
              />
            </div>
            <div className="flex space-x-2">
              <button
                className="btn btn-primary btn-sm w-full"
                onClick={handleListNFT}
              >
                上架
              </button>
             
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
