import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { RentalCollectible } from "../../Rental/page"; // 导入 RentalCollectible 类型

export const NFTCardRental = ({ nft }: { nft: RentalCollectible }) => {
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const [rentAmount, setRentAmount] = useState<string>(""); // 租赁金额
  const [depositAmount, setDepositAmount] = useState<string>(""); // 押金金额
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

 
  // 自动计算租金和押金总金额
  const rentPriceInWei = parseEther(nft.rentPrice.toString()); // 将 rentPrice 转换为 Wei
  const depositPriceInWei = parseEther(nft.deposit.toString()); // 将 deposit 转换为 Wei
  const totalAmountInWei = rentPriceInWei + depositPriceInWei; // 租金 + 押金


 
  // 租赁 NFT
  const rentNFT = async () => {
    try {
      // 检查输入的租赁金额和押金是否有效
      if (parseFloat(rentAmount) <= 0 || parseFloat(depositAmount) <= 0) {
        setErrorMessage("Please provide valid rent and deposit amounts.");
        return;
      }

      // 执行租赁交易
      await writeContractAsync({
        functionName: "rentNFT",
        args: [BigInt(nft.tokenId.toString())],
        value: totalAmountInWei, // 租金 + 押金
      });

      setErrorMessage(null); // 清除错误信息
      alert("NFT rented successfully!");
    } catch (err) {
      console.error("Error renting NFT", err);
      setErrorMessage("Failed to rent the NFT. Please try again.");
    }
  };

  // 确保只有活跃的租赁显示
  if (!nft.isActive) {
    return null; // 如果租赁不可用，则不显示
  }
  //console.log("NFT Image URL:", nft.image);  // 确认图片 URL 是否有效
  console.log("NFT Owner:", nft.owner);      // 确认拥有者地址是否有效
  console.log("NFT Data:", nft.duration);  // 检查完整的 nft 对象
  const durationInDays = Number(nft.duration) / 86400;

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden rounded-2xl border border-base-300">
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
              #{nft.tokenId}
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

        {/* 租赁信息 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-base-200 rounded-xl p-3">
            <span className="text-sm text-base-content/70 block">租金</span>
            <span className="font-medium">{nft.rentPrice} ETH</span>
          </div>
          <div className="bg-base-200 rounded-xl p-3">
            <span className="text-sm text-base-content/70 block">押金</span>
            <span className="font-medium">{nft.deposit} ETH</span>
          </div>
          <div className="bg-base-200 rounded-xl p-3 col-span-2">
            <span className="text-sm text-base-content/70 block">租期</span>
            <span className="font-medium">{durationInDays.toFixed(0)} 天</span>
          </div>
        </div>

        {/* 租赁按钮 */}
        <button
          onClick={rentNFT}
          className="btn btn-primary w-full mt-6 font-bold tracking-wide hover:scale-[1.02] transition-transform duration-200"
        >
          租赁 NFT
        </button>

        {/* 错误信息 */}
        {errorMessage && (
          <div className="mt-4 p-4 bg-error/10 rounded-xl">
            <p className="text-error text-sm">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};
