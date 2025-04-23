"use client";

import { useEffect, useState } from "react";
import { NFTCardAuction } from "../myNFTs/_components/bidding";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { formatEther } from "viem";

export interface AuctionCollectible extends Partial<NFTMetaData> {
  tokenId: string;
  minPrice: string;
  highestBid: string;
  highestBidder: string;
  auctionEndTime: number;
  auctionCreator: string;
  isAuctionActive: boolean;
  tokenURI: string;
}

export const Auction = () => {
  const [auctionCollectibles, setAuctionCollectibles] = useState<AuctionCollectible[]>([]);
  const [allAuctionsLoading, setAllAuctionsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Get contract instance
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // Fetch all active auctions from the contract using `getActiveAuctions`
  const { data: onAuctionNfts } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getAuctionsByStatus", // Assuming this function fetches only active auctions
    args: [true], // `true` 表示获取活跃的拍卖
    watch: true,
  });

  const fetchAuctionedNfts = async (): Promise<void> => {
    setAllAuctionsLoading(true);
    setFetchError(null); // 重置之前的错误
    try {
      if (!onAuctionNfts || onAuctionNfts.length === 0) {
        setFetchError("No active auctions available.");
        return;
      }
  
      const fetchedNfts: AuctionCollectible[] = await Promise.all(
        onAuctionNfts.map(async (item: any) => {
          const tokenId: string = item.tokenId.toString();
          const minPriceInEth = formatEther(item.minPrice);
          const minPrice: string = minPriceInEth.toString();
          const highestBidInEth = formatEther(item.highestBid);
          const highestBid: string = highestBidInEth.toString();
          const highestBidder: string = item.highestBidder;
          const auctionEndTime: number = item.endTime;
          const auctionCreator: string = item.auctionCreator;
          const isAuctionActive: boolean = item.active;
          const tokenURI: string = item.tokenUri;
  
          let metadata: Partial<NFTMetaData> = {};
          try {
            metadata = await getMetadataFromIPFS(tokenURI);
          } catch (err) {
            console.error(`Error fetching metadata for tokenId ${tokenId}:`, err);
            notification.error(`Error fetching metadata for tokenId ${tokenId}`);
          }
          console.log("Fetching metadata from URI:", item.tokenUri);

          return {
            tokenId,
            minPrice,
            highestBid,
            highestBidder,
            auctionEndTime,
            auctionCreator,
            isAuctionActive,
            tokenURI,
            ...metadata,
          };
        })
     
      );
      console.log("fetchedNfts", fetchedNfts);
      // 更新拍卖数据
      setAuctionCollectibles(fetchedNfts);
    } catch (err) {
      console.error("Error fetching auctioned NFTs:", err);
      notification.error("Error fetching auctioned NFTs.");
      setFetchError("Error fetching auctioned NFTs.");
    } finally {
      setAllAuctionsLoading(false);
    }
  };
  

  useEffect(() => {
    if (!onAuctionNfts || !yourCollectibleContract) return;
    fetchAuctionedNfts();
  }, [onAuctionNfts]);

  if (allAuctionsLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center space-y-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-xl text-primary-content animate-pulse">Loading Auctions...</p>
        </div>
      </div>
    );

  if (fetchError)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-error/10 p-8 rounded-lg shadow-lg">
          <div className="text-2xl text-error flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {fetchError}
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#1a1f2e] bg-gradient-to-b from-[#1a1f2e] to-[#141824]">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold">
            <span className="text-[#7f9ff5]">神秘拍卖场</span>
            <span className="text-[#a5b6f3] ml-4">|</span>
            <span className="text-[#8ca4f0] ml-4">Mystery Auction</span>
          </h1>
          <p className="text-[#8ca4f0]/70 text-xl">
            探索独特的 NFT 拍卖品
            <br />
            Explore Unique NFT Auctions
          </p>
        </div>

        {auctionCollectibles.length === 0 ? (
          <div className="flex justify-center items-center mt-10">
            <div className="bg-[#1e2538]/50 backdrop-blur-sm p-12 rounded-2xl border border-[#2a3347] text-center space-y-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-[#7f9ff5]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h2 className="text-2xl font-bold text-[#7f9ff5]">暂无活跃拍卖</h2>
              <p className="text-[#8ca4f0]/60">敬请期待新的神秘 NFT！</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {auctionCollectibles.map((nft, index) => (
              <div 
                key={nft.tokenId} 
                className="transform hover:scale-105 transition-all duration-300 hover:z-10"
                style={{ 
                  animationDelay: `${index * 150}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <NFTCardAuction nft={nft} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auction;
