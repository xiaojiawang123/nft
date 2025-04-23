"use client";

import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useAccount, usePublicClient,useContractRead } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { useState } from "react";
import { parseUnits,formatUnits } from "viem";  // 使用 viem 库中的 parseUnits 函数
import { saveNFTToDB } from "~~/utils/route";


const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const [nftCount, setNftCount] = useState(1); // 默认铸币数量为 1
  const [nftData, setNftData] = useState({
    names: Array(nftCount).fill(""),
    descriptions: Array(nftCount).fill(""),
    imageFiles: Array(nftCount).fill(null),
    royaltyPercentages: Array(nftCount).fill(0),
    price: Array(nftCount).fill(0),
  });
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制弹窗显示与隐藏
const publicClient = usePublicClient();
  const handleNftCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let count = parseInt(e.target.value);
    if (isNaN(count) || count < 1) {
      count = 1;
    }
    setNftCount(count);
    setNftData({
      names: Array(count).fill(""),
      descriptions: Array(count).fill(""),
      imageFiles: Array(count).fill(null),
      royaltyPercentages: Array(count).fill(0),
      price: Array(count).fill(0),
    });
  };

  const handleBatchMintItems = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const formData = new FormData(e.currentTarget);
    const names = [];
    const descriptions = [];
    const imageFiles = [];
    const royaltyPercentages = [];
    const price = [];
  
    // 收集每个 NFT 的数据
    for (let i = 0; i < nftCount; i++) {
      names.push(formData.get(`name-${i}`) as string);
      descriptions.push(formData.get(`description-${i}`) as string);
      imageFiles.push(formData.get(`image-${i}`) as File);
      royaltyPercentages.push(Number(formData.get(`royaltyPercentage-${i}`))); // 保持为百分比整数，例如 500 表示 5%
      price.push(Number(formData.get(`price-${i}`))); // 获取 ETH 单位的价格
    }
  
    // 确保每个 NFT 的所有字段都已填写
    for (let i = 0; i < nftCount; i++) {
      if (!names[i] || !descriptions[i] || !imageFiles[i] || royaltyPercentages[i] === undefined) {
        notification.error(`请填写完整的 NFT ${i + 1} 信息。`);
        return;
      }
    }
  
    // 确保名称和描述唯一
    const uniqueNames = new Set(names);
    const uniqueDescriptions = new Set(descriptions);
  
    if (uniqueNames.size !== nftCount) {
      notification.error("每个 NFT 的名称必须是唯一的。");
      return;
    }
  
    if (uniqueDescriptions.size !== nftCount) {
      notification.error("每个 NFT 的描述必须是唯一的。");
      return;
    }
  
    // 上传元数据到 IPFS
    const metadataPromises = imageFiles.map((imageFile, index) => {
      return new Promise(async (resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const imageBase64 = reader.result as string;
  
          const metadata = {
            name: names[index],
            description: descriptions[index],
            image: imageBase64,
          };
  
          try {
            const uploadedItem = await addToIPFS(metadata);
            resolve(uploadedItem);
          } catch (error) {
            reject(error);
          }
        };
  
        reader.readAsDataURL(imageFile);
      });
    });
  
    const notificationId = notification.loading("正在上传元数据到 IPFS...");
    try {
      const uploadedItems = await Promise.all(metadataPromises);
      notification.remove(notificationId);
      notification.success("元数据上传到 IPFS 成功");
  
      // 将价格从 ETH 转换为 wei
      const priceInWei = price.map((ethPrice) => parseUnits(ethPrice.toString(), 18));
  
      // // 批量铸币
      // await writeContractAsync({
      //   functionName: "batchMintItems",
      //   args: [connectedAddress, uploadedItems, royaltyPercentages, priceInWei],
      // });
  
  // 返回交易数据
  const mintTx = await writeContractAsync({
      functionName: "batchMintItems",
      args: [connectedAddress, uploadedItems, royaltyPercentages, priceInWei],
  });
  
    
   
  const receipt = await publicClient?.getTransactionReceipt({ hash: mintTx as `0x${string}` });
   console.log("receipt=============",receipt);
    // 提取 Gas 消耗信息
    const gasUsed = receipt.gasUsed.toString(); // 消耗的 Gas 数量
    const effectiveGasPrice = receipt.effectiveGasPrice.toString(); // 每单位 Gas 的价格
    const totalGasCost = BigInt(gasUsed) * BigInt(effectiveGasPrice); // 总 Gas 成本（wei）
    const totalGasCostInEth = formatUnits(totalGasCost, 18); // 转换为 ETH

    console.log("Gas Used:", gasUsed);//消耗的 Gas 数量
    console.log("Effective Gas Price (Wei):", effectiveGasPrice);// 每单位 Gas 的价格
    console.log("Total Gas Cost (ETH):", totalGasCostInEth);// 转换为 ETH
  const token_id = receipt?.logs[0]?.topics[3];
  const numericId = parseInt(token_id as `0x${string}`, 16);
 
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
  if (token_id) {
      const data = {
        token_id: numericId,
          token_uri: uploadedItems,
          timestamp: timestamp,
          owner: connectedAddress,
          creator: connectedAddress,
          price: priceInWei.toString(),
          state: 0,
          royaltyFeeNumerator: royaltyPercentages.toString(),
      };
      
      await saveNFTToDB(data);
      notification.success("批量铸币成功！");
      setIsModalOpen(false); // 关闭弹窗
  }
     
    } catch (error) {
      notification.remove(notificationId);
      console.error(error);
      notification.error("批量铸币失败。");
    }
    console.log("royaltyPercentages", royaltyPercentages);
console.log("price", price);

  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-300 to-base-100">
      {/* 页面头部 */}
      <div className="relative bg-gradient-to-r from-primary/20 to-secondary/20 py-10">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold text-center text-base-content mb-4">
            我的 NFT 收藏
          </h1>
          <p className="text-center text-base-content/70 text-lg">
            探索、管理和交易您的数字艺术品
          </p>
        </div>
      </div>

      {/* 操作区域 */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center mb-8">
          {!isConnected || isConnecting ? (
            <div className="card bg-base-200 shadow-xl p-8">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold mb-2">连接钱包</h3>
                <p className="text-base-content/70">连接您的钱包以管理您的 NFT</p>
              </div>
              <RainbowKitCustomConnectButton />
            </div>
          ) : (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary btn-lg gap-2 shadow-lg hover:shadow-primary/50 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              铸造新的 NFT
            </button>
          )}
        </div>

        {/* 铸币模态框 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-base-300 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">铸造新的 NFT</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBatchMintItems} className="space-y-6">
                {/* NFT 数量选择 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">要铸造的 NFT 数量</span>
                  </label>
                  <input
                    type="number"
                    value={nftCount}
                    onChange={handleNftCountChange}
                    min="1"
                    className="input input-bordered w-full"
                    placeholder="输入 NFT 数量"
                  />
                </div>

                {/* 动态 NFT 表单 */}
                <div className="space-y-8">
                  {Array.from({ length: nftCount }).map((_, index) => (
                    <div key={index} className="card bg-base-200 p-6 space-y-4">
                      <h3 className="font-bold text-lg">NFT #{index + 1}</h3>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">NFT 名称</span>
                        </label>
                        <input
                          type="text"
                          name={`name-${index}`}
                          className="input input-bordered"
                          placeholder="输入 NFT 名称"
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">NFT 描述</span>
                        </label>
                        <textarea
                          name={`description-${index}`}
                          className="textarea textarea-bordered h-24"
                          placeholder="输入 NFT 描述"
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">版税比例 (%)</span>
                        </label>
                        <input
                          type="number"
                          name={`royaltyPercentage-${index}`}
                          className="input input-bordered"
                          placeholder="例如：500 表示 5%"
                          min="0"
                          max="10000"
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">NFT 图片</span>
                        </label>
                        <input
                          type="file"
                          name={`image-${index}`}
                          accept="image/*"
                          className="file-input file-input-bordered w-full"
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">价格 (ETH)</span>
                        </label>
                        <input
                          type="number"
                          name={`price-${index}`}
                          className="input input-bordered"
                          placeholder="输入 NFT 价格"
                          step="0.000000000000000001"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full btn-lg mt-6"
                >
                  确认铸造
                </button>
              </form>
            </div>
          </div>
        )}

        {/* NFT 展示区域 */}
        <MyHoldings />
      </div>
    </div>
  );
};

export default MyNFTs;
