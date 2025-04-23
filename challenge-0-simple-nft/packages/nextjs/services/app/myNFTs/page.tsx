
"use client";

import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { useState } from "react";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const [nftCount, setNftCount] = useState(1); // 默认铸币数量为 1
  const [nftData, setNftData] = useState({
    names: Array(nftCount).fill(""),
    descriptions: Array(nftCount).fill(""),
    imageFiles: Array(nftCount).fill(null),
    royaltyPercentages: Array(nftCount).fill(0),
  });

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
    });
  };

  const handleBatchMintItems = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const names = [];
    const descriptions = [];
    const imageFiles = [];
    const royaltyPercentages = [];

    // 收集每个 NFT 的数据
    for (let i = 0; i < nftCount; i++) {
      names.push(formData.get(`name-${i}`) as string);
      descriptions.push(formData.get(`description-${i}`) as string);
      imageFiles.push(formData.get(`image-${i}`) as File);
      royaltyPercentages.push(Number(formData.get(`royaltyPercentage-${i}`)));
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

      // 批量铸币
      await writeContractAsync({
        functionName: "batchMintItems",
        args: [connectedAddress, uploadedItems, royaltyPercentages],
      });

      notification.success("批量铸币成功！");
    } catch (error) {
      notification.remove(notificationId);
      console.error(error);
      notification.error("批量铸币失败。");
    }
  };

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">我的 NFTs</span>
          </h1>
        </div>
      </div>
      <div className="flex justify-center">
        {!isConnected || isConnecting ? (
          <RainbowKitCustomConnectButton />
        ) : (
          <form onSubmit={handleBatchMintItems} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-bold">要铸币的 NFT 数量</label>
              <input
                className="input input-bordered"
                type="number"
                value={nftCount}
                onChange={handleNftCountChange}
                min="1"
                placeholder="输入 NFT 数量"
              />
            </div>

            {/* 动态渲染每个 NFT 的字段 */}
            {Array.from({ length: nftCount }).map((_, index) => (
              <div key={index} className="flex flex-col gap-4">
                <label className="font-bold">NFT {index + 1} 详情</label>
                <input
                  className="input input-bordered"
                  type="text"
                  name={`name-${index}`}
                  placeholder="NFT 名称"
                  required
                />
                <textarea
                  className="textarea textarea-bordered"
                  name={`description-${index}`}
                  placeholder="NFT 描述"
                  required
                />
                <input
                  className="input input-bordered"
                  type="number"
                  name={`royaltyPercentage-${index}`}
                  placeholder="版权费用百分比 (例如：500 表示 5%)"
                  min="0"
                  max="10000"
                  required
                />
                <input
                  className="input input-bordered"
                  type="file"
                  name={`image-${index}`}
                  accept="image/*"
                  required
                />
              </div>
            ))}
            <button className="btn btn-secondary" type="submit">
              铸币 NFT
            </button>
          </form>
        )}
      </div>
      <MyHoldings />
    </>
  );
};

export default MyNFTs;
