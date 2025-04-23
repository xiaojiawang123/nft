"use client";

import { useState, useEffect } from "react";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { keccak256, toBytes } from "viem";

interface BlindBox {
  id: string; // 16进制格式的ID
  price: string;
  creator: string;
  isActive: boolean;
  nftCount: number;
}

const BlindBoxManager = () => {
  const { address } = useAccount(); // 获取当前用户地址
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const [price, setPrice] = useState<string>("");
  const [tokenId, setTokenId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedBoxId, setGeneratedBoxId] = useState<string>("");
  const [selectedBoxId, setSelectedBoxId] = useState<string>("");
  const [userBlindBoxes, setUserBlindBoxes] = useState<BlindBox[]>([]);

  // 弹窗控制状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddNFTModalOpen, setIsAddNFTModalOpen] = useState(false);

  // 获取所有盲盒信息
  const { data: boxInfo } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getBlindBoxesByStatus",
    args: [true],
    watch: true,
  });

  // 处理盲盒数据
  useEffect(() => {
    if (boxInfo && Array.isArray(boxInfo)) {
      const [ids, prices, creators, actives, nftCounts] = boxInfo;
      
      const boxes: BlindBox[] = ids.map((id: bigint, index: number) => ({
        // 转换为16进制格式，并移除 '0x' 前缀
        id: id.toString(16).replace('0x', ''),
        price: (prices[index] / BigInt(1e18)).toString(),
        creator: creators[index],
        isActive: actives[index],
        nftCount: Number(nftCounts[index]),
      })).filter(box => box.creator.toLowerCase() === address?.toLowerCase());

      setUserBlindBoxes(boxes);
    }
  }, [boxInfo, address]);

  // 生成盲盒ID的函数
  const generateBoxId = () => {
    // 使用当前时间戳、随机数和一些额外信息来生成唯一的哈希
    const timestamp = Date.now().toString();
    const random = Math.random().toString();
    const dataToHash = timestamp + random;
    
    // 使用 keccak256 生成哈希
    const hash = keccak256(toBytes(dataToHash));
    // 取哈希的前16位作为盲盒ID
    const boxId = hash.slice(2, 18);
    return boxId;
  };

  // 创建盲盒
  const createBlindBox = async () => {
    try {
      if (!price) {
        setErrorMessage("请输入价格");
        return;
      }

      // 生成新的盲盒ID
      const newBoxId = generateBoxId();
      setGeneratedBoxId(newBoxId);

      const priceInWei = parseEther(price);
      const boxIdBigInt = BigInt(`0x${newBoxId}`);

      await writeContractAsync({
        functionName: "createBlindBox",
        args: [boxIdBigInt, priceInWei],
      });

      setErrorMessage(null);
      alert(`盲盒创建成功！\n盲盒ID: ${newBoxId}`);
      setIsCreateModalOpen(false);
      setPrice("");
    } catch (err) {
      console.error("Error creating blind box", err);
      setErrorMessage("创建盲盒失败，请重试。");
    }
  };

  // 修改 addNFTToBox 函数
  const addNFTToBox = async () => {
    try {
      if (!selectedBoxId || !tokenId) {
        setErrorMessage("请选择盲盒ID和输入NFT Token ID");
        return;
      }

      // 确保添加 '0x' 前缀再转换为 BigInt
      const boxIdBigInt = BigInt(`0x${selectedBoxId}`);

      await writeContractAsync({
        functionName: "addNFTToBlindBox",
        args: [boxIdBigInt, BigInt(tokenId)],
        value: BigInt(0),
      });

      setErrorMessage(null);
      alert("NFT添加成功！");
      setIsAddNFTModalOpen(false);
      setTokenId("");
      setSelectedBoxId("");
    } catch (err) {
      console.error("Error adding NFT to blind box", err);
      setErrorMessage("添加NFT失败，请重试。");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
          盲盒管理中心
        </h1>
        <p className="text-gray-300">创建和管理您的 NFT 盲盒</p>
      </div>

      {/* 操作按钮区域 */}
      <div className="flex flex-wrap justify-center gap-6 mb-12">
        <button
          className="btn btn-primary btn-lg px-8 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-none shadow-lg"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建盲盒
        </button>

        <button
          className="btn btn-secondary btn-lg px-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-none shadow-lg"
          onClick={() => setIsAddNFTModalOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          添加 NFT
        </button>
      </div>

      {/* 盲盒统计信息 */}
      {userBlindBoxes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="stat bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="stat-title text-gray-400">总盲盒数量</div>
            <div className="stat-value text-purple-400">{userBlindBoxes.length}</div>
          </div>
          <div className="stat bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="stat-title text-gray-400">总 NFT 数量</div>
            <div className="stat-value text-pink-400">
              {userBlindBoxes.reduce((sum, box) => sum + box.nftCount, 0)}
            </div>
          </div>
          <div className="stat bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="stat-title text-gray-400">活跃盲盒</div>
            <div className="stat-value text-blue-400">
              {userBlindBoxes.filter(box => box.isActive).length}
            </div>
          </div>
        </div>
      )}

      {/* 创建盲盒模态框 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl w-[450px] max-w-lg relative border border-gray-700 shadow-xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold mb-6 text-white text-center">创建盲盒</h3>

            <div className="space-y-6">
              {/* 价格输入 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">价格设置</label>
                <div className="relative">
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入价格"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">ETH</span>
                </div>
              </div>

              {/* 说明信息 */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">创建说明</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• 系统将自动生成唯一的盲盒ID</li>
                  <li>• 创建成功后将显示盲盒ID，请妥善保存</li>
                  <li>• 盲盒价格一旦设置后将不可更改</li>
                  <li>• 其他用户购买盲盒时将随机获得其中一个 NFT</li>
                </ul>
              </div>

              {/* 创建按钮 */}
              <button
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg"
                onClick={createBlindBox}
              >
                创建盲盒
              </button>

              {errorMessage && (
                <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 添加 NFT 模态框 */}
      {isAddNFTModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl w-[450px] max-w-lg relative border border-gray-700 shadow-xl">
            <button
              onClick={() => setIsAddNFTModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold mb-6 text-white text-center">添加 NFT 到盲盒</h3>

            <div className="space-y-6">
              {/* 盲盒选择下拉菜单 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">选择盲盒</label>
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择盲盒</option>
                  {userBlindBoxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      盲盒 #{box.id} (NFT数量: {box.nftCount})
                    </option>
                  ))}
                </select>
              </div>

              {/* NFT Token ID 输入 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">NFT Token ID</label>
                <input
                  type="text"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入 NFT Token ID"
                />
              </div>

              {/* 说明信息 */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">添加说明</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• 只显示您创建的盲盒</li>
                  <li>• 添加后 NFT 将被转移到合约地址</li>
                  <li>• 确保您拥有该 NFT 的所有权</li>
                </ul>
              </div>

              {/* 添加按钮 */}
              <button
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg"
                onClick={addNFTToBox}
              >
                添加 NFT
              </button>

              {errorMessage && (
                <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 底部装饰 */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
    </div>
  );
};

export default BlindBoxManager;