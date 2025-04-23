import { OnSaleCollectible } from "../../market/page";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

export const NFTCardOnSale = ({ nft }: { nft: OnSaleCollectible }) => {
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const priceInWei = parseEther(nft.price.toString()); // 将 NFT 的价格转换为 wei 单位

  // 下架函数
  const handleUnlist = async () => {
    try {
      await writeContractAsync({
        functionName: "unlistNft",
        args: [BigInt(nft.tokenId.toString())],
      });
    } catch (err) {
      console.error("Error calling unlistNft function", err);
    }
  };

  // ... existing code ...
return (
  <div className="card card-compact hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-base-100 to-base-200 shadow-xl w-[320px] overflow-hidden border border-primary/20">
    <figure className="relative group">
      <img src={nft.image} alt="NFT Image" className="h-64 w-full object-cover transition-transform duration-200 group-hover:scale-110" />
      <figcaption className="glass absolute bottom-4 left-4 p-3 rounded-xl backdrop-blur-md bg-black/30">
        <span className="text-white font-semibold">#{nft.tokenId}</span>
      </figcaption>
    </figure>
    <div className="card-body space-y-4 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-primary font-medium">名称:</span>
          <p className="text-lg font-bold">{nft.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {nft.attributes?.map((attr, index) => (
            <span key={index} className="badge badge-primary badge-outline py-3 px-4">
              {attr.value}
            </span>
          ))}
        </div>
      </div>
      
      <div className="space-y-1">
        <span className="text-primary font-medium">描述:</span>
        <p className="text-sm text-gray-600 line-clamp-2">{nft.description}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-primary font-medium">拥有者:</span>
        <Address address={nft.seller as `0x${string}`} />
      </div>
      
      <div className="flex items-center justify-between mt-4 border-t pt-4">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">价格</span>
          <span className="text-xl font-bold text-primary">{nft.price} ETH</span>
        </div>
        
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-sm px-6 hover:scale-105 transition-transform"
            onClick={async () => {
              try {
                await writeContractAsync({
                  functionName: "purchaseNft",
                  args: [BigInt(nft.tokenId.toString())],
                  value: priceInWei,
                });
              } catch (err) {
                console.error("Error calling purchaseNft function", err);
              }
            }}
          >
            购买
          </button>

          <button
            className="btn btn-outline btn-error btn-sm px-6 hover:scale-105 transition-transform"
            onClick={handleUnlist}
          >
            下架
          </button>
        </div>
      </div>
    </div>
  </div>
);
// ... existing code ...
};
