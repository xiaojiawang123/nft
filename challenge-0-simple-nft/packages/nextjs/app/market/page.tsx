"use client";

import { useEffect, useState } from "react";
import { NFTCardOnSale } from "../myNFTs/_components/NFTCardOnSale";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { formatEther } from "viem"; 

export interface OnSaleCollectible extends Partial<NFTMetaData> {
  tokenId: string;
  price: string;
  seller: string;
  isListed: boolean;
  tokenURI: string;
}

export const Market = () => {
  const [onSaleCollectibles, setOnSaleCollectibles] = useState<OnSaleCollectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 搜索框内容
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]); // 默认价格区间 [0, 10000]
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const itemsPerPage = 4; // 每页显示 4 个卡片
  
  // 获取合约实例
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // 调用合约函数获取所有上架的 NFT
  const { data: onSaleNfts} = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getAllListedNfts",
    watch: true,
  });

  const fetchListedNfts = async (): Promise<void> => {
    setAllCollectiblesLoading(true);
    try {
      const fetchedNfts: OnSaleCollectible[] = await Promise.all(
        (onSaleNfts || []).map(async (item: any) => {
          const tokenId: string = item.tokenId.toString();
          const priceInEth = formatEther(item.price);
          const price: string = priceInEth.toString();
          const seller: string = item.seller;
          const isListed: boolean = item.isListed;
          const tokenURI: string = item.tokenUri;

          let metadata: Partial<NFTMetaData> = {};
          try {
            metadata = await getMetadataFromIPFS(tokenURI);
          } catch (err) {
            console.error(`Error fetching metadata for tokenId ${tokenId}:`, err);
            notification.error(`Error fetching metadata for tokenId ${tokenId}`);
          }

          return {
            tokenId,
            price,
            seller,
            isListed,
            tokenURI,
            ...metadata,
          };
        })
      );

      setOnSaleCollectibles(fetchedNfts);
    } catch (err) {
      console.error("Error fetching listed NFTs:", err);
      notification.error("Error fetching listed NFTs.");
    } finally {
      setAllCollectiblesLoading(false);
    }
  };

  // 根据名称和价格范围进行筛选
  const filteredNfts = onSaleCollectibles.filter(nft => {
    const lowerCaseSearch = searchQuery.toLowerCase();

    const price = parseFloat(nft.price || "0");
    const inPriceRange = price >= priceRange[0] && price <= priceRange[1];

    return (
      (nft.name?.toLowerCase().includes(lowerCaseSearch) || 
       nft.tokenId.toLowerCase().includes(lowerCaseSearch) || 
       nft.seller.toLowerCase().includes(lowerCaseSearch)) &&
      inPriceRange
    );
  });

  // 更新价格范围时检查是否为有效数字
  const handlePriceRangeChange = (type: "min" | "max", value: string) => {
    const selectedValue = parseInt(value);
    if (!isNaN(selectedValue)) {
      setPriceRange(prevRange => {
        const newRange = [...prevRange];
        if (type === "min") {
          newRange[0] = selectedValue;
        } else {
          newRange[1] = selectedValue;
        }
        return newRange as [number, number];
      });
    }
  };

  // 更新当前页面
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // 获取当前页要显示的NFT
  const currentPageNfts = filteredNfts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (!onSaleNfts || !yourCollectibleContract) return;
    fetchListedNfts();
  }, [onSaleNfts]);

  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  // 生成价格区间选项
  const priceOptions = Array.from({ length: Math.floor(10000 / 10) }, (_, index) => index * 10);

 // ... existing code ...
return (
  <div className="container mx-auto px-4 py-8">
    {/* 新增欢迎区域 */}
    <div className="mb-12 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl"></div>
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            欢迎来到 NFT 艺术市场
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            探索独特的数字艺术作品，发现您的下一个收藏珍品
            <span className="text-primary">·</span>
            开启您的 NFT 收藏之旅
          </p>
          
          <div className="flex justify-center gap-4 mt-6">
            <div className="stats shadow">
              <div className="stat place-items-center">
                <div className="stat-title">在售 NFT</div>
                <div className="stat-value text-primary">{filteredNfts.length}</div>
              </div>
              
              <div className="stat place-items-center">
                <div className="stat-title">价格区间</div>
                <div className="stat-value text-secondary">{priceRange[0]}-{priceRange[1]} ETH</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 搜索和筛选区域 - 优化样式 */}
    <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 bg-base-200/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-primary/10">
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索 NFT 名称、Token ID 或卖家地址..."
            className="input input-bordered w-full focus:input-primary transition-all duration-200 pl-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-primary font-medium whitespace-nowrap">价格区间:</span>
        <div className="flex items-center gap-2">
          <select
            className="select select-bordered select-sm w-28 focus:select-primary"
            value={priceRange[0]}
            onChange={(e) => handlePriceRangeChange("min", e.target.value)}
          >
            {priceOptions.map(price => (
              <option key={price} value={price}>{price} ETH</option>
            ))}
          </select>
          <span className="text-primary">至</span>
          <select
            className="select select-bordered select-sm w-28 focus:select-primary"
            value={priceRange[1]}
            onChange={(e) => handlePriceRangeChange("max", e.target.value)}
          >
            {priceOptions.map(price => (
              <option key={price} value={price}>{price} ETH</option>
            ))}
          </select>
        </div>
      </div>
    </div>

    {allCollectiblesLoading ? (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="text-gray-500">正在加载 NFT 列表...</p>
      </div>
    ) : filteredNfts.length === 0 ? (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-3xl font-bold text-primary">暂无 NFT</div>
        <p className="text-gray-500">没有找到符合条件的 NFT</p>
      </div>
    ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {currentPageNfts.map(nft => (
            <NFTCardOnSale nft={nft} key={nft.tokenId} />
          ))}
        </div>

        {/* 分页控件 - 保持原样 */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            className="btn btn-primary btn-outline btn-sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            上一页
          </button>
          
          <span className="px-4 py-2 rounded-lg bg-primary/10 font-medium">
            第 {currentPage} 页
          </span>

          <button
            className="btn btn-primary btn-outline btn-sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= filteredNfts.length}
          >
            下一页
          </button>
        </div>
      </>
    )}
  </div>
);
};

export default Market;
