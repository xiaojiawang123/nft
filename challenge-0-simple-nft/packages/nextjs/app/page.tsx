import Image from "next/image";
import type { NextPage } from "next";
import { ClockIcon, ChartBarIcon } from "@heroicons/react/24/outline";

const NFTCard = ({ image, title, floor }: { image: string; title: string; floor: string }) => (
  <div className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1">
    <div className="aspect-square w-full overflow-hidden rounded-xl">
      <Image
        src={image}
        alt={title}
        width={400}
        height={400}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-sm text-white/80">Floor: {floor}</p>
    </div>
  </div>
);

const Home: NextPage = () => {
  const featuredNFTs = [
    {
      image: "/OIP-C (5).png",
      title: "Bored Ape Yacht Club",
      floor: "0.1 ETH",
    },
    {
      image: "/OIP-C (6).png",
      title: "Azuki Collection",
      floor: "0.08 ETH",
    },
    {
      image: "/mutant-975x1024-1.png",
      title: "Mutant Ape",
      floor: "0.05 ETH",
    },
    {
      image: "/OIP-C (1).png",
      title: "CryptoKitties",
      floor: "0.02 ETH",
    },
    {
      image: "/OIP-C (2).png",
      title: "Doodles",
      floor: "0.03 ETH",
    },
    {
      image: "/OIP-C (3).png",
      title: "Art Blocks",
      floor: "0.04 ETH",
    },
    {
      image: "/OIP-C (4).png",
      title: "Cool Cats",
      floor: "0.015 ETH",
    },
    {
      image: "/OIP-C.png",
      title: "World of Women",
      floor: "0.025 ETH",
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={32} height={32} className="rounded-full" />
            <span className="text-lg font-bold text-white">NFT Gallery</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20">
              <ClockIcon className="h-4 w-4" />
              <span>24小时</span>
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20">
              <ChartBarIcon className="h-4 w-4" />
              <span>All chains</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 标题区域 */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">Featured Collections</h1>
          <p className="text-lg text-gray-400">Discover the most outstanding NFTs in all topics of life.</p>
        </div>

        {/* NFT 网格 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredNFTs.map((nft, index) => (
            <NFTCard key={index} {...nft} />
          ))}
        </div>

     
      </div>
    </div>
  );
};

export default Home;
