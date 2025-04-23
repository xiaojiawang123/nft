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
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  if (fetchError)
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="text-2xl text-red-500">{fetchError}</div>
      </div>
    );
   

  return (
    <>
      {auctionCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">No Active Auctions Found</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {auctionCollectibles.map(nft => (
            <NFTCardAuction nft={nft} key={nft.tokenId} />
          ))}
        </div>
      )}
    </>
  );
};

export default Auction;
