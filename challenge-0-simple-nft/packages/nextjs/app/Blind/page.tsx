"use client";

import { useEffect, useState } from "react";
import { BlindBoxCard } from "../myNFTs/_components/Blind";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
//import { parseEther } from "ethers";

export interface BlindBoxCollectible {
  id: string;
  price: string;
  creator: string;
  nftCount: number;
  isActive: boolean;
}

export const BlindBox = () => {
  const [blindBoxCollectibles, setBlindBoxCollectibles] = useState<BlindBoxCollectible[]>([]);
  const [allBlindBoxesLoading, setAllBlindBoxesLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [boxStatus, setBoxStatus] = useState<boolean>(true); // true for active, false for inactive

  // 获取合约实例
  const { data: yourBlindBoxContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // 使用 useScaffoldReadContract 获取盲盒数据
  const { data: blindBoxesData, error: readContractError } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getBlindBoxesByStatus",
    args: [boxStatus], // 根据传入的状态获取盲盒
    watch: true,
  });

  // 获取盲盒详情
  const fetchBlindBoxDetails = async (): Promise<void> => {
    console.log("fetchBlindBoxDetails is called");
  
    setAllBlindBoxesLoading(true); // 设置加载状态
    setFetchError(null); // 清除之前的错误
  
    try {
      if (!blindBoxesData) {
        setFetchError("No active or inactive blind boxes available.");
        console.error("No blindBoxesData found.");
        return;
      }
  
      // 打印原始数据结构，确保数据正确
      console.log("blindBoxesData raw data:", blindBoxesData);
  
      // 解构 blindBoxesData 数据
      const [ids, prices, creators, actives, nftCounts] = blindBoxesData;
  
      // 遍历数据，构造 BlindBoxCollectible 对象数组
      const fetchedBlindBoxes: BlindBoxCollectible[] = ids.map((id: bigint, index: number) => {
        return {
          id: id.toString(16), // 转换为16进制
          price: (prices[index] / BigInt(1e18)).toString(), // 转换价格为 ETH 单位
          creator: creators[index], // 创建者地址
          isActive: actives[index], // 是否激活
          nftCount: Number(nftCounts[index]), // NFT 数量转换为数字
        };
      });
  
      console.log("Fetched Blind Boxes (raw):", fetchedBlindBoxes);
  
      // 使用 Map 去重，确保 ID 唯一
      const uniqueBlindBoxes = Array.from(
        new Map(fetchedBlindBoxes.map((box) => [box.id, box])).values()
      );
  
      console.log("Fetched Blind Boxes (deduplicated):", uniqueBlindBoxes);
  
      // 更新盲盒状态
      setBlindBoxCollectibles(uniqueBlindBoxes);
    } catch (err) {
      console.error("Error fetching blind boxes:", err); // 打印错误
      notification.error("Error fetching blind boxes."); // 显示错误通知
      setFetchError("Error fetching blind boxes."); // 设置错误状态
    } finally {
      setAllBlindBoxesLoading(false); // 关闭加载状态
    }
  };
  
  // 使用 useEffect 来监控合约数据变化并触发数据获取
  useEffect(() => {
    if (!blindBoxesData || !yourBlindBoxContract) return;
    fetchBlindBoxDetails();
  }, [blindBoxesData, boxStatus]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-base-200 to-base-300">
      {/* 顶部装饰元素 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-12">
        {/* 标题区域 */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-gradient">
            神秘盲盒 | Mystery Box
          </h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto leading-relaxed">
            探索独特的 NFT 收藏品 
            <span className="block text-sm mt-1">Explore Unique NFT Collections</span>
          </p>
        </div>

        {/* 状态切换按钮 - 改进的设计 */}
        <div className="flex justify-center mb-12">
          <div className="bg-base-300/50 p-1 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="flex space-x-2">
             
            
            </div>
          </div>
        </div>

        {/* 加载状态 - 改进的动画 */}
        {allBlindBoxesLoading && (
          <div className="flex flex-col justify-center items-center mt-16">
            <div className="relative">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <span className="loading loading-spinner loading-lg text-secondary absolute top-0 left-0 animate-ping"></span>
            </div>
            <p className="mt-6 text-lg font-medium text-base-content/70 animate-pulse">
              Loading Mystery Boxes...
            </p>
          </div>
        )}

        {/* 错误状态 - 改进的提示 */}
        {fetchError && (
          <div className="flex justify-center items-center mt-16">
            <div className="alert alert-error shadow-xl max-w-md backdrop-blur-sm bg-error/90">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">Error</h3>
                <p className="text-sm">{fetchError}</p>
              </div>
            </div>
          </div>
        )}

        

        {/* 盲盒列表 - 改进的网格布局和动画 */}
        {!allBlindBoxesLoading && !fetchError && blindBoxCollectibles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 container mx-auto">
            {blindBoxCollectibles.map((box, index) => (
              <div 
                key={box.id} 
                className="transform hover:scale-105 hover:rotate-1 transition-all duration-300 ease-out"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="backdrop-blur-sm bg-base-100/30 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <BlindBoxCard box={box} activeStatus={boxStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlindBox;
