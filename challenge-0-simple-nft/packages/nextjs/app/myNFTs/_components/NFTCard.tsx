import { useState, useEffect } from "react";
import { Collectible } from "./MyHoldings";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

//export const NFTCard = ({ nft }: { nft: Collectible }) => {
  export const NFTCard = ({ nft, isOwner, isRenter }: { nft: Collectible, isOwner: boolean, isRenter: boolean }) => {
  const [transferToAddress, setTransferToAddress] = useState("");
  const [isListed, setIsListed] = useState(false);
  const [royaltyPercentage, setRoyaltyPercentage] = useState<number>(0);
const [timestamp, setTimestamp] = useState<number>(0);
const [mintPrice, setMintPrice] = useState<string>("");  // 铸币时价格
  const [price, setPrice] = useState<string>(""); // 上架价格 (ETH)


  const [auctionPrice, setAuctionPrice] = useState<string>(""); // 拍卖起拍价 (ETH)
  const [auctionEndTime, setAuctionEndTime] = useState<string>(""); // 拍卖结束时间
  const [isAuctionActive, setIsAuctionActive] = useState(false); // 当前拍卖是否活跃
  const [isAuctionStarted, setIsAuctionStarted] = useState(false); // 是否发起过拍卖
  const [isRentalActive, setIsRentalActive] = useState(false); // 当前租赁是否活跃
  const [rentalPrice, setRentalPrice] = useState<string>(""); // 租赁价格 (ETH)
  const [rentalDuration, setRentalDuration] = useState<string>(""); // 租赁时长 (天)
  const [loading, setLoading] = useState(true); // 数据加载状态
  const [isAuctionModalOpen, setAuctionModalOpen] = useState(false); // 控制拍卖模态框
  const [isListModalOpen, setListModalOpen] = useState(false); // 控制上架模态框
  const [isRentalModalOpen, setRentalModalOpen] = useState(false); // 控制租赁模态框
  const [deposit, setDeposit] = useState<string>(""); // 押金 (ETH)
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
    functionName: "auctions",
    args: [BigInt(nft.id.toString())],
    watch: true,
  });

  useEffect(() => {
    if (nftItem) {
      setIsListed(nftItem.isListed as boolean);
      setPrice(BigInt(nftItem.price).toString());
      setMintPrice(BigInt(nftItem.price).toString()); // 转换为字符串格式
      setTimestamp(Number(nftItem.timestamp));  // 设置时间戳
    } else {
      setIsListed(false);
      setPrice("");
      setMintPrice("");
      setTimestamp(0);
    }
    setLoading(false);

    if (auctionInfo) {
      setIsAuctionActive(auctionInfo.active);
      console.log("Auction active status:", auctionInfo.active);
    }

    setLoading(false); // 数据加载完成
  }, [nftItem, auctionInfo]);

  const handleListNFT = async () => {
    console.log("上架 NFT:", nft.id);
    console.log("价格 (ETH):", price);
  
    // 验证输入的价格是否有效
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      alert("请输入有效的价格（ETH）");
      return;
    }
  
    try {
      // 保持价格为 ETH，但在计算时将其转换为 wei
      const priceWei = parseEther(price); // 价格转换为 wei
      console.log("价格 (wei):", priceWei);
  
      // 获取上架费用
      const listingPrice = await yourCollectibleContract?.read.calculateListingFee([BigInt(priceWei)]);
      console.log("上架费用 (wei):", listingPrice);
  
      // 调用合约进行上架操作
      await writeContractAsync({
        functionName: "placeNftOnSale",
        args: [BigInt(nft.id.toString()), priceWei],
        value: listingPrice, // 上架费用以 wei 为单位传递
      });
  
      console.log("NFT 上架成功！");
      setPrice(""); // 清空输入框
      setListModalOpen(false); // 关闭模态框
  
    } catch (err) {
      console.error("Error calling placeNftOnSale function", err);
      alert("上架失败，请重试！");
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
  
    // 当前时间
    const currentTimeStamp = Math.floor(Date.now() / 1000); // 当前时间戳，秒级
    console.log("当前时间戳:", currentTimeStamp);
  
    // 用户选择的拍卖结束时间
    const auctionEndTimeStamp = new Date(auctionEndTime).getTime() / 1000; // 转换为秒级时间戳
    console.log("用户选择的拍卖结束时间戳:", auctionEndTimeStamp);
  
    // 确保结束时间比当前时间晚
    if (auctionEndTimeStamp <= currentTimeStamp) {
      alert("拍卖结束时间必须晚于当前时间！");
      return;
    }
  
    // 计算持续时间（秒数）
    const durationInSeconds = auctionEndTimeStamp - currentTimeStamp;
    console.log("拍卖持续时间（秒）:", durationInSeconds);
  
  
  
    try {
      const auctionPriceWei = parseEther(auctionPrice);
      await writeContractAsync({
        functionName: "createAuction",
        args: [BigInt(nft.id.toString()), auctionPriceWei, BigInt(durationInSeconds)], // 持续时间以秒传递给合约
      });
      setIsAuctionActive(true);
      setIsAuctionStarted(true); // 更新状态为已发起
      setAuctionModalOpen(false); // 关闭拍卖弹窗
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

  const handleStartRental = async () => {
    // 验证租赁价格
    if (!rentalPrice || isNaN(Number(rentalPrice)) || Number(rentalPrice) <= 0) {
      alert("请输入有效的租赁价格（ETH）");
      return;
    }
  
    // 验证押金
    if (!deposit || isNaN(Number(deposit)) || Number(deposit) <= 0) {
      alert("请输入有效的押金（ETH）");
      return;
    }
  
    // 验证租赁时长
    if (!rentalDuration || isNaN(Number(rentalDuration)) || Number(rentalDuration) <= 0) {
      alert("请输入有效的租赁时长（天）");
      return;
    }
  
   
  
    // 转换租赁价格为 Wei
    const rentalPriceWei = parseEther(rentalPrice);
  
    // 转换租赁时长为秒
    const rentalDurationInSeconds = Number(rentalDuration) * 24 * 60 * 60;
    console.log("租赁时长（秒）:", rentalDurationInSeconds);
  
    // 转换押金为 Wei
    const depositWei = parseEther(deposit);
  
    try {
      // 调用合约创建租赁
      await writeContractAsync({
        functionName: "createRental",
        args: [
          BigInt(nft.id.toString()),                // tokenId
          rentalPriceWei,                            // 租赁价格（Wei）
          depositWei,                                // 押金（Wei）
          BigInt(rentalDurationInSeconds)         // 租赁时长（秒）
                                       
        ], 
      });
  
      // 设置租赁状态为激活
      setIsRentalActive(true);
      setRentalModalOpen(false);  // 关闭租赁弹窗
    } catch (err) {
      console.error("Error calling createRental function:", err);
      alert("租赁创建失败，请重试");
    }
  };
  
  


  const handleEndRental = async () => {
    console.log("结束租赁:", nft.id);
  
    
    try {
      await writeContractAsync({
        functionName: "endRental",
        args: [BigInt(nft.id.toString())],
      });
     
     
    } catch (err) {
      console.error("Error calling endAuction function:", err);
    }
};

  // 修改打开模态框的处理函数
  const openListModal = () => {
    // 将 mintPrice 从 Wei 转换为 ETH 并设置为默认价格
    const priceInEth = Number(mintPrice) / 1e18;
    setPrice(priceInEth.toString());
    setListModalOpen(true);
  };

  if (loading) {
    return <div>加载中...</div>;
  }

// 在渲染部分显示结束拍卖按钮
return (
  <div className="card bg-base-100 hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl border border-base-300">
    {/* NFT 图片区域 */}
    <figure className="relative aspect-square">
      <img 
        src={nft.image} 
        alt={nft.name} 
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-primary/80 backdrop-blur-sm rounded-full text-white font-bold">
            #{nft.id}
          </span>
        </div>
      </div>
    </figure>

    {/* NFT 信息区域 */}
    <div className="card-body p-6">
      {/* 标题和描述 */}
      <div className="space-y-2">
        <h2 className="card-title text-2xl">{nft.name}</h2>
        <p className="text-base-content/70 line-clamp-2">{nft.description}</p>
      </div>

      {/* 所有者信息 */}
      <div className="flex items-center gap-2 py-3 px-4 bg-base-200 rounded-xl mt-4">
        <span className="text-sm font-medium">拥有者</span>
        <Address address={nft.owner as `0x${string}`} />
      </div>

      {/* NFT 详细信息 */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-base-200 rounded-xl p-3">
          <span className="text-sm text-base-content/70 block">价格</span>
          <span className="font-medium">{parseFloat(mintPrice) / 1e18} ETH</span>
        </div>
        <div className="bg-base-200 rounded-xl p-3">
          <span className="text-sm text-base-content/70 block">铸造时间</span>
          <span className="font-medium">{new Date(timestamp * 1000).toLocaleDateString()}</span>
        </div>
      </div>

      {/* 操作按钮组 */}
      <div className="card-actions flex-col gap-2 mt-4">
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setAuctionModalOpen(true)}
          >
            发起拍卖
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={openListModal}
          >
            上架出售
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setRentalModalOpen(true)}
          >
            租赁
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleEndRental}
          >
            结束租赁
          </button>
        </div>
        <div className="w-full">
          <button
            className="btn btn-error btn-sm w-full"
            onClick={handleEndAuction}
          >
            结束拍卖
          </button>
        </div>

        <div className="text-xs text-base-content/50">
          Auction Active: {isAuctionActive ? 'Yes' : 'No'}
        </div>
      </div>
    </div>

    {/* 模态框样式优化 */}
    {isAuctionModalOpen && (
      <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm z-50">
        <div className="bg-base-100 p-8 rounded-2xl w-[450px] max-w-lg relative border border-base-300 shadow-xl">
          <button
            onClick={() => setAuctionModalOpen(false)}
            className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
          >
            ✕
          </button>
          
          <h3 className="text-2xl font-bold mb-6 text-center">发起拍卖</h3>
          
          <div className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">起拍价格 (ETH)</span>
              </label>
              <input
                type="text"
                value={auctionPrice}
                onChange={(e) => setAuctionPrice(e.target.value)}
                className="input input-bordered w-full"
                placeholder="请输入起拍价格"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">拍卖结束时间</span>
              </label>
              <input
                type="datetime-local"
                value={auctionEndTime}
                onChange={(e) => setAuctionEndTime(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={handleStartAuction}
            >
              确认发起拍卖
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 上架模态框 */}
    {isListModalOpen && (
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-50">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl w-[450px] max-w-lg relative border border-gray-700 shadow-xl">
          {/* 关闭按钮 */}
          <button
            onClick={() => {
              setPrice(""); // 清空价格
              setListModalOpen(false); // 关闭模态框
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 标题 */}
          <h3 className="text-2xl font-bold mb-6 text-white text-center">上架 NFT</h3>

          <div className="space-y-6">
            {/* 价格输入区域 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                价格设置
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入价格"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  ETH
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                设置您的 NFT 售价，其他用户可以直接以此价格购买
              </p>
            </div>

            {/* 上架说明 */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">上架须知</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• 上架后其他用户可以查看并购买您的 NFT</li>
                <li>• 成功售出后，您将获得扣除平台费用后的收益</li>
                <li>• 您可以随时取消上架</li>
              </ul>
            </div>

            {/* 上架按钮 */}
            <button
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              onClick={handleListNFT}
            >
              确认上架
            </button>
          </div>
        </div>
      </div>
    )}
   {/* 租赁模态框 */}
   {isRentalModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl w-[450px] max-w-lg relative border border-gray-700 shadow-xl">
            {/* 关闭按钮 */}
            <button
              onClick={() => setRentalModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 标题 */}
            <h3 className="text-2xl font-bold mb-6 text-white text-center">发起租赁</h3>

            <div className="space-y-6">
              {/* 租赁价格输入 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  租赁价格 (ETH)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入租赁价格"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    ETH
                  </span>
                </div>
              </div>

              {/* 租赁时长输入 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  租赁时长 (天)
                </label>
                <input
                  type="text"
                  value={rentalDuration}
                  onChange={(e) => setRentalDuration(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入租赁时长"
                />
              </div>

              {/* 押金输入 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  押金 (ETH)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入押金"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    ETH
                  </span>
                </div>
              </div>

              {/* 租赁说明 */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">租赁须知</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• 租赁期间，NFT 将暂时转移给租户</li>
                  <li>• 租期结束后，NFT 将自动归还给所有者</li>
                  <li>• 押金将在租期结束后退还（扣除任何损坏费用）</li>
                </ul>
              </div>

              {/* 确认按钮 */}
              <button
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                onClick={handleStartRental}
              >
                确认发起租赁
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
);
};
