"use client";

import { lazy, useEffect, useState } from "react";
import type { NextPage } from "next";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

const LazyReactJson = lazy(() => import("react-json-view"));

const IpfsDownload: NextPage = () => {
  const [yourJSON, setYourJSON] = useState({});
  const [ipfsPath, setIpfsPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleIpfsDownload = async () => {
    setLoading(true);
    const notificationId = notification.loading("Getting data from IPFS");
    try {
      const metaData = await getMetadataFromIPFS(ipfsPath);
      notification.remove(notificationId);
      notification.success("Downloaded from IPFS");

      setYourJSON(metaData);
    } catch (error) {
      notification.remove(notificationId);
      notification.error("Error downloading from IPFS");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <h1 className="text-center mb-4">
          <span className="block text-4xl font-bold">Download from IPFS</span>
        </h1>
        <div className={`flex border-2 border-accent/95 bg-base-200 rounded-full text-accent w-96`}>
          <input
            className="input input-ghost focus:outline-none focus:bg-transparent focus:text-secondary-content h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-secondary-content/75"
            placeholder="IPFS CID"
            value={ipfsPath}
            onChange={e => setIpfsPath(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button
          className={`btn btn-secondary my-6 ${loading ? "loading" : ""}`}
          disabled={loading}
          onClick={handleIpfsDownload}
        >
          Download from IPFS
        </button>

        {mounted && (
          <LazyReactJson
            style={{ padding: "1rem", borderRadius: "0.75rem" }}
            src={yourJSON}
            theme="solarized"
            enableClipboard={false}
            onEdit={edit => {
              setYourJSON(edit.updated_src);
            }}
            onAdd={add => {
              setYourJSON(add.updated_src);
            }}
            onDelete={del => {
              setYourJSON(del.updated_src);
            }}
          />
        )}
      </div>
    </>
  );
};

export default IpfsDownload;
// "use client"; // 指示这是一个客户端组件

// import { lazy, useEffect, useState } from "react"; // 导入 React 相关的钩子
// import type { NextPage } from "next"; // 导入 NextPage 类型
// import { notification } from "~~/utils/scaffold-eth"; // 导入通知工具
// import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch"; // 导入从 IPFS 获取元数据的工具函数
// import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth"; // 导入用于读写合约的钩子

// // 懒加载 react-json-view 组件，用于显示 JSON 数据
// const LazyReactJson = lazy(() => import("react-json-view"));

// // 定义 IpfsDownload 组件
// const IpfsDownload: NextPage = () => {
//   // 定义状态变量
//   const [yourJSON, setYourJSON] = useState({}); // 存储从 IPFS 下载的 JSON 数据
//   const [ipfsPath, setIpfsPath] = useState(""); // 存储用户输入的 IPFS CID
//   const [loading, setLoading] = useState(false); // 控制加载状态
//   const [mounted, setMounted] = useState(false); // 控制组件是否已挂载
//   const [listedNFTs, setListedNFTs] = useState<any[]>([]); // 存储已上架的 NFT 列表

//   // 从合约中读取功能
//   const { readContract } = useScaffoldReadContract("YourCollectible");
//   const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

//   // 组件挂载后获取已上架的 NFT
//   useEffect(() => {
//     setMounted(true);
//     fetchListedNFTs(); // 初始化时获取已上架的 NFT
//   }, []);

//   // 获取所有上架的 NFT
//   const fetchListedNFTs = async () => {
//     try {
//       const nfts = await readContract({
//         functionName: "getAllListedNFTs", // 从合约中读取已上架 NFT 的方法
//       });
//       setListedNFTs(nfts); // 更新状态以存储已上架的 NFT
//     } catch (error) {
//       console.error("Error fetching listed NFTs:", error); // 输出错误信息
//     }
//   };

//   // 从 IPFS 下载数据
//   const handleIpfsDownload = async () => {
//     setLoading(true); // 设置加载状态
//     const notificationId = notification.loading("Getting data from IPFS"); // 显示加载通知
//     try {
//       const metaData = await getMetadataFromIPFS(ipfsPath); // 从 IPFS 获取元数据
//       notification.remove(notificationId); // 移除加载通知
//       notification.success("Downloaded from IPFS"); // 显示成功通知

//       setYourJSON(metaData); // 更新状态以存储下载的数据
//     } catch (error) {
//       notification.remove(notificationId); // 移除加载通知
//       notification.error("Error downloading from IPFS"); // 显示错误通知
//       console.log(error); // 输出错误信息
//     } finally {
//       setLoading(false); // 恢复加载状态
//     }
//   };

//   // 购买 NFT 的功能
//   const handleBuyNFT = async (nftId: bigint, price: bigint) => {
//     const notificationId = notification.loading("Processing purchase..."); // 显示加载通知
//     try {
//       await writeContractAsync({ // 调用合约的购买方法
//         functionName: "buyNFT",
//         args: [nftId], // 购买的 NFT ID
//         overrides: { value: price }, // 发送的 ETH 价值
//       });
//       notification.remove(notificationId); // 移除加载通知
//       notification.success("NFT purchased successfully!"); // 显示成功通知
//       fetchListedNFTs(); // 重新获取已上架的 NFT 列表
//     } catch (error) {
//       notification.remove(notificationId); // 移除加载通知
//       notification.error("Error purchasing NFT"); // 显示错误通知
//       console.log(error); // 输出错误信息
//     }
//   };

//   // 组件的渲染部分
//   return (
//     <>
//       <div className="flex items-center flex-col flex-grow pt-10">
//         <h1 className="text-center mb-4">
//           <span className="block text-4xl font-bold">Download from IPFS</span> {/* 主标题 */}
//         </h1>
//         <div className={`flex border-2 border-accent/95 bg-base-200 rounded-full text-accent w-96`}>
//           <input
//             className="input input-ghost focus:outline-none focus:bg-transparent focus:text-secondary-content h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-secondary-content/75"
//             placeholder="IPFS CID" // 输入框占位符
//             value={ipfsPath} // 绑定状态
//             onChange={(e) => setIpfsPath(e.target.value)} // 处理输入变化
//             autoComplete="off" // 禁用自动完成功能
//           />
//         </div>
//         <button
//           className={`btn btn-secondary my-6 ${loading ? "loading" : ""}`} // 按钮样式
//           disabled={loading} // 禁用加载时的按钮
//           onClick={handleIpfsDownload} // 点击事件处理
//         >
//           Download from IPFS
//         </button>

//         {mounted && ( // 组件挂载后渲染 JSON 视图
//           <LazyReactJson
//             style={{ padding: "1rem", borderRadius: "0.75rem" }} // 设置样式
//             src={yourJSON} // JSON 数据源
//             theme="solarized" // 主题
//             enableClipboard={false} // 禁用剪贴板功能
//             onEdit={(edit) => {
//               setYourJSON(edit.updated_src); // 编辑 JSON 数据
//             }}
//             onAdd={(add) => {
//               setYourJSON(add.updated_src); // 添加 JSON 数据
//             }}
//             onDelete={(del) => {
//               setYourJSON(del.updated_src); // 删除 JSON 数据
//             }}
//           />
//         )}

//         <div className="mt-8 w-full max-w-3xl"> {/* 已上架 NFT 列表 */}
//           <h2 className="text-2xl font-semibold mb-4">Listed NFTs for Sale</h2>
//           <div className="space-y-4">
//             {listedNFTs.map((nft, index) => ( // 遍历已上架的 NFT
//               <div key={index} className="card bg-base-200 shadow-lg p-4">
//                 <h3 className="text-xl font-bold">{nft.name}</h3> {/* NFT 名称 */}
//                 <p>Description: {nft.description}</p> {/* NFT 描述 */}
//                 <p>Price: {nft.price.toString()} wei</p> {/* NFT 价格 */}
//                 <button
//                   className="btn btn-primary mt-2" // 购买按钮样式
//                   onClick={() => handleBuyNFT(nft.id, nft.price)} // 点击购买事件
//                 >
//                   Buy NFT
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default IpfsDownload; // 导出 IpfsDownload 组件

