import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { BlindBoxCollectible } from "../../Blind/page";

interface BlindBoxCardProps {
  box: BlindBoxCollectible;
  activeStatus: boolean;
}

export const BlindBoxCard = ({ box, activeStatus }: BlindBoxCardProps) => {
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const buyBlindBox = async (box: BlindBoxCollectible) => {
    try {
      if (box.nftCount === 0) {
        setErrorMessage("No NFTs available in this box.");
        return;
      }

      const priceInWei = parseEther(box.price.toString());
      const boxIdBigInt = BigInt(`0x${box.id}`);

      await writeContractAsync({
        functionName: "buyMysteryBox",
        args: [boxIdBigInt],
        value: priceInWei,
      });

      setErrorMessage(null);
      alert("Blind box purchased successfully!");
    } catch (err) {
      console.error("Error purchasing blind box", err);
      setErrorMessage("Failed to purchase the blind box. Please try again.");
    }
  };

  return (
    <div className="relative group bg-gray-800/90 rounded-2xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 w-[300px]">
      {/* 盲盒内容 */}
      <div className="p-6">
        {/* 盲盒ID和状态 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            盲盒 #{box.id}
          </h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            box.nftCount > 0 ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
          }`}>
            {box.nftCount > 0 ? `${box.nftCount} NFT` : '已售罄'}
          </div>
        </div>

        {/* 价格和NFT数量 */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">价格</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-white">{box.price}</span>
              <span className="ml-1 text-gray-400">ETH</span>
            </div>
          </div>
        </div>

        {/* 创建者信息 */}
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-gray-400 text-sm">创建者:</span>
          <div className="flex items-center space-x-1 bg-gray-700/50 px-2 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
            <Address address={box.creator as `0x${string}`} />
          </div>
        </div>

        {/* 购买按钮 */}
        <button
          onClick={() => buyBlindBox(box)}
          disabled={box.nftCount === 0}
          className={`
            w-full py-3 px-4 rounded-xl font-medium text-sm
            ${box.nftCount > 0
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
            transition-all duration-300
          `}
        >
          {box.nftCount > 0 ? '购买盲盒' : '已售罄'}
        </button>

        {/* 错误信息 */}
        {errorMessage && (
          <div className="mt-3 text-red-500 text-sm">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};
