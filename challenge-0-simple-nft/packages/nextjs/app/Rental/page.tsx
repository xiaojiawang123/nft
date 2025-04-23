"use client";

import { useEffect, useState } from "react";
import { NFTCardRental } from "../myNFTs/_components/rental";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { formatEther } from "viem";

// 定义 RentalCollectible 类型
export interface RentalCollectible extends Partial<NFTMetaData> {
  tokenId: string;
  rentPrice: string;
  deposit: string;
  renter: string;
  owner: string;
  startTime: number;
  duration: number;
  isActive: boolean;
  tokenURI: string;
  status: boolean;
}

export const Rental = () => {
  const [rentalCollectibles, setRentalCollectibles] = useState<RentalCollectible[]>([]);
  const [allRentalsLoading, setAllRentalsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 获取合约实例
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // 获取租赁数据
  const { data: rentalData } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getRentalDataByStatus", // 获取租赁数据
    args: [true], // 默认获取活跃租赁
    watch: true,
  });
  console.log("Rental Data:", rentalData);  // 添加此行来调试

  // 获取租赁的 NFT 信息
  const fetchRentedNfts = async (): Promise<void> => {
    setAllRentalsLoading(true);
    setFetchError(null); // 重置错误
    try {
      if (!rentalData || rentalData.length === 0) {
        setFetchError("No rentals found.");
        return;
      }

      console.log("Rental Data:", rentalData); // 打印返回的数据，帮助调试

      const fetchedRentals: RentalCollectible[] = await Promise.all(
        rentalData.map(async (item: any) => {
          // 安全检查，确保 item.tokenId 存在
          if (!item.tokenId) {
            console.error(`Missing tokenId for rental item:`, item);
            return null; // 如果 tokenId 不存在，跳过这个租赁项
          }

          const tokenId = item.tokenId.toString(); // 转换 tokenId 为字符串
          const rentPriceInEth = formatEther(item.rentPrice);
          const rentPrice = rentPriceInEth.toString();
          const depositInEth = formatEther(item.deposit);
          const deposit = depositInEth.toString();
          const renter = item.renter;
          const owner: string = item.owner;
          const startTime = item.startTime;
          const duration = item.duration;
          const isActive = item.active;  // 确保 'active' 是正确的字段名称
          const tokenURI = item.tokenUri;
          const status = item.status;    
          // 获取 NFT 的元数据
          let metadata: Partial<NFTMetaData> = {};
          try {
            metadata = await getMetadataFromIPFS(tokenURI);
          } catch (err) {
            console.error(`Error fetching metadata for tokenId ${tokenId}:`, err);
            notification.error(`Error fetching metadata for tokenId ${tokenId}`);
          }

          return {
            tokenId,
            rentPrice,
            deposit,
            renter,
            startTime,
            duration,
            isActive,
            owner,
            tokenURI,
            status,
            ...metadata,
          };
        })
      );

      // 过滤掉已租赁的项（即 isActive 为 false 的项）
      setRentalCollectibles(fetchedRentals.filter((rental) => rental !== null && rental.status));
    } catch (err) {
      console.error("Error fetching rented NFTs:", err);
      notification.error("Error fetching rented NFTs.");
      setFetchError("Error fetching rented NFTs.");
    } finally {
      setAllRentalsLoading(false);
    }
  };

  // 每次租赁状态变化时重新获取租赁数据
  useEffect(() => {
    fetchRentedNfts();
  }, [rentalData]);

  // 加载状态的优化显示
  if (allRentalsLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-base-200 to-base-300">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-lg font-medium text-base-content/70 animate-pulse">
            正在加载租赁信息...
          </p>
        </div>
      </div>
    );
  }

  // 错误状态的优化显示
  if (fetchError) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-base-200 to-base-300">
        <div className="text-center space-y-4 p-8 bg-error/10 rounded-2xl">
          <div className="text-5xl">😢</div>
          <div className="text-2xl font-bold text-error">{fetchError}</div>
          <button 
            className="btn btn-error btn-outline mt-4"
            onClick={() => fetchRentedNfts()}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-300">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            NFT 租赁市场
          </h1>
          <p className="mt-4 text-base-content/70">
            探索并租赁独特的 NFT 资产
          </p>
        </div>

        {rentalCollectibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-base-100/50 backdrop-blur-sm rounded-3xl p-8">
            <img 
              src="/no-data.svg" // 你需要添加一个合适的空状态图片
              alt="No rentals"
              className="w-48 h-48 opacity-50"
            />
            <div className="text-2xl font-medium text-base-content/70 mt-6">
              暂无可租赁的 NFT
            </div>
            <p className="text-base-content/50 mt-2">
              请稍后再来查看
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rentalCollectibles.map((nft, index) => (
              <div 
                key={nft.tokenId}
                className="transform hover:scale-[1.02] transition-all duration-300"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <NFTCardRental nft={nft} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rental;
