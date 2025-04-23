// import { useState, useEffect } from "react";
import { OnSaleCollectible } from "../../market/page";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";
// nft 是一个传入的 prop，表示正在出售的 NFT 对象，类型为 OnSaleCollectible
export const NFTCardOnSale = ({ nft }: { nft: OnSaleCollectible }) => {
  // const [transferToAddress, setTransferToAddress] = useState("");

  // const [isListed, setIsListed] = useState(false);
  // const [price, setPrice] = useState<string>(""); // 以ETH为单位

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const priceInWei = parseEther(nft.price.toString());// 将 NFT 的价格转换为 wei 单位，方便在合约中使用

  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
      <figure className="relative">
        {/* eslint-disable-next-line  */}
        <img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />
        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white "># {nft.tokenId}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <div className="flex items-center justify-center">
          <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
          <div className="flex flex-wrap space-x-2 mt-1">
            {nft.attributes?.map((attr, index) => (
              <span key={index} className="badge badge-primary py-3">
                {attr.value}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="my-0 text-lg">{nft.description}</p>
        </div>
        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold">Owner : </span>
          <Address address={nft.seller as `0x${string}`} />
        </div>
        <div className="flex flex-col my-1 space-y-1">
         <span className="text-lg font-semibold"> price: {nft.price} ETH  </span>
        </div>

        <div className="card-actions justify-end">
          <button
            className="btn btn-secondary btn-md px-8 tracking-wide"
            onClick={() => {
              try {
                writeContractAsync({
                  functionName: "purchaseNft",
                  args: [BigInt(nft.tokenId.toString())],
                  value: priceInWei
                });
              } catch (err) {
                console.error("Error calling transferFrom function");
              }
            }}
          >
            购买
          </button>


        </div>
      </div>
    </div>
  );
};
