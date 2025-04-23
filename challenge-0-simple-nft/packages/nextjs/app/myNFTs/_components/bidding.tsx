import { useState, useEffect } from "react";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { AuctionCollectible } from "../../AuctionMarket/page";

export const NFTCardAuction = ({ nft }: { nft: AuctionCollectible }) => {
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const [bidAmount, setBidAmount] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 获取所有活跃拍卖的数据
  const { data: activeAuctionsData } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getAuctionsByStatus",
    args: [true], // 获取活跃拍卖
    watch: true,
  });

  const priceInWei = parseEther(bidAmount || "0");

  const placeBid = async () => {
    try {
      if (parseFloat(bidAmount) <= parseFloat(nft.highestBid)) {
        setErrorMessage("Your bid must be higher than the current highest bid.");
        return;
      }

      await writeContractAsync({
        functionName: "bid",
        args: [BigInt(nft.tokenId.toString())],
        value: priceInWei,
      });

      setErrorMessage(null); // Clear any previous error
      alert("Bid placed successfully!");
    } catch (err) {
      console.error("Error placing bid", err);
      setErrorMessage("Failed to place the bid. Please try again.");
    }
  };

  // Ensure only active auctions are displayed
  if (!nft.isAuctionActive) {
    return null; // Render nothing if the auction is not active
  }

  // 获取拍卖数据中的时间信息
  const auctionData = activeAuctionsData?.find((auction) => auction.tokenId.toString() === nft.tokenId.toString());
console.log("auctionData", auctionData);
  const startTime = auctionData ? Number(auctionData.startTime) : null; // 获取上架时间
  const endTime = auctionData ? Number(auctionData.endTime) : null; // 获取结束时间

  // 计算拍卖开始时间和结束时间 (转换为本地时间)
  const formattedStartTime = startTime ? new Date(startTime * 1000) : null; // 转换为本地时间 (秒 -> 毫秒)
 
 
  const formattedEndTime = endTime ? new Date(endTime * 1000).toLocaleString() : null;
  return (
    <div className="relative group">
      {/* 背景光效 */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7f9ff5] to-[#a5b6f3] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
      
      <div className="relative bg-[#1e2538] rounded-xl border border-[#2a3347] overflow-hidden">
        <div className="relative h-72">
          <img 
            src={nft.image} 
            alt="NFT Image" 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f2e]/90 to-transparent" />
          
          {/* NFT ID Tag */}
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-[#2a3347]/80 backdrop-blur-sm border border-[#3d4760]">
            <span className="text-[#7f9ff5] font-bold">#{nft.tokenId}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#7f9ff5] group-hover:text-[#a5b6f3] transition-colors">
              {nft.name}
            </h2>
            <p className="text-[#8ca4f0]/70 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
              {nft.description}
            </p>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#232a3d] p-4 rounded-xl border border-[#2a3347]">
              <p className="text-sm text-[#8ca4f0]/70 mb-1">起拍价</p>
              <p className="text-lg font-bold text-[#7f9ff5] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
                </svg>
                {nft.minPrice} ETH
              </p>
            </div>
            <div className="bg-[#232a3d] p-4 rounded-xl border border-[#2a3347]">
              <p className="text-sm text-[#8ca4f0]/70 mb-1">当前出价</p>
              <p className="text-lg font-bold text-[#a5b6f3] flex items-center gap-2">
                {nft.highestBid} ETH
              </p>
            </div>
          </div>

          {/* Creator Info */}
          <div className="bg-[#232a3d] p-4 rounded-xl border border-[#2a3347]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2a3347] flex items-center justify-center">
                <span className="text-[#7f9ff5]">创</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#8ca4f0]/70">创建者</p>
                <Address address={nft.auctionCreator as `0x${string}`} />
              </div>
            </div>
          </div>

          {/* Time Info */}
          {formattedStartTime && formattedEndTime && (
            <div className="bg-[#232a3d] p-4 rounded-xl border border-[#2a3347] space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-[#8ca4f0]/70">开始时间</p>
                  <p className="text-sm font-medium text-[#7f9ff5]">{formattedStartTime.toLocaleString()}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#7f9ff5]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-[#8ca4f0]/70">结束时间</p>
                  <p className="text-sm font-medium text-[#7f9ff5]">{formattedEndTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bidding Section */}
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="输入竞拍价格 (ETH)"
                className="flex-1 px-4 py-3 bg-[#232a3d] border border-[#2a3347] rounded-xl text-[#7f9ff5] placeholder-[#8ca4f0]/40 focus:outline-none focus:border-[#7f9ff5]"
              />
              <button
                onClick={placeBid}
                className="px-6 py-3 bg-gradient-to-r from-[#7f9ff5] to-[#a5b6f3] rounded-xl font-bold text-white hover:brightness-110 transition-all duration-300"
              >
                竞拍
              </button>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000-16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
