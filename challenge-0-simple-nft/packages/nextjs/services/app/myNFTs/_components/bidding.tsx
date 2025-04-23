import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { AuctionCollectible } from "../../AuctionMarket/page";

export const NFTCardAuction = ({ nft }: { nft: AuctionCollectible }) => {
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const [bidAmount, setBidAmount] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const priceInWei = parseEther(bidAmount || "0");
  console.log("Rendered NFT:", nft);
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

  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
      <figure className="relative">
        <img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />
        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white"># {nft.tokenId}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <div className="flex items-center justify-center">
          <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="my-0 text-lg">{nft.description}</p>
        </div>
        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold">卖家: </span>
          <Address address={nft.auctionCreator as `0x${string}`} />
        </div>
        <div className="flex flex-col my-1 space-y-1">
          <span className="text-lg font-semibold">初始拍卖价格: {nft.minPrice} ETH</span>
          <span className="text-lg font-semibold">当前最高出价: {nft.highestBid} ETH</span>
        </div>

        {/* Bid input */}
        <div className="flex space-x-3 mt-2">
          <input
            type="text"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter your bid"
            className="input input-bordered input-primary w-full"
          />
          <button
            className="btn btn-primary btn-md px-8 tracking-wide"
            onClick={placeBid}
          >
            Place Bid
          </button>
        </div>

        {errorMessage && (
          <div className="text-red-500 mt-2 text-sm">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};
