// "use client";

// import type { NextPage } from "next";
// import { Address } from "~~/components/scaffold-eth";
// import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
// import {format} from "date-fns";
// import { formatEther } from "viem";
// const Transfers: NextPage = () => {
//   const { data:purchaseEvents , isLoading, error } = useScaffoldEventHistory({
//     contractName: "YourCollectible",
//     eventName: "NftPurchased",
//     // Specify the starting block number from which to read events, this is a bigint.
//     // filters: {
//     //   tokenId: BigInt(tokeid)
//     // }
//     fromBlock: 0n,
//     blockData: true,
//   });

//   if (isLoading)
//     return (
//       <div className="flex justify-center items-center mt-10">
//         <span className="loading loading-spinner loading-xl"></span>
//       </div>
//     );

//   if (error) 
//     return(
//     <div className="text-red-500 text-center mt-10">
//       出错了。。
//       </div>
//   );
//   console.log(purchaseEvents);
//   return (
//     <>
//       <div className="flex items-center flex-col flex-grow pt-10">
//         <div className="px-5">
//           <h1 className="text-center mb-8">
//             <span className="block text-4xl font-bold">All Transfers Events</span>
//           </h1>
//         </div>
//         <div className="overflow-x-auto shadow-lg">
//           <table className="table table-zebra w-full">
//             <thead>
//               <tr>
//                 <th className="bg-primary">Token Id</th>
//                 <th className="bg-primary">Buyer</th>
//                 <th className="bg-primary">Seller</th>
//                 <th className="bg-primary">Price</th>
//                 <th className="bg-primary">Tinestamp</th>
//               </tr>
//             </thead>
//             <tbody>
//               {!purchaseEvents || purchaseEvents.length === 0 ? (
//                 <tr>
//                   <td colSpan={5} className="text-center">
//                     No events found
//                   </td>
//                 </tr>
//               ) : (
//                 purchaseEvents?.map((event, index) => {
//                   const tokenId = event.args.tokenId?.toString() ?? "N/A";//安全访问tokerid
//                   const buyer = event.args.buyer ?? "N/A";
//                   const seller = event.args.seller ?? "N/A";
//                   const priceInWei = event.args.price ?? 0n;
//                   const priceInEth = formatEther(priceInWei);//使用formatEther从viem转换为wei到Eth
//                   // const priceInEth = formatEther(BigInt(priceInWei)); // 使用BigInt将string转换为bigint

//                   const blocktimestamp = event.block?.timestamp;
//                   const timestamp = blocktimestamp
//                   ? format(new Date(Number(blocktimestamp) * 1000), "yyyy-MM-dd HH:mm:ss")
//                   : "N/A";
                
//                   return (
//                     <tr key={index}>
//                       <td className="text-center">{tokenId}</td>
//                       <td>
//                         <Address address={buyer as '0x${string}' | undefined} />
//                       </td>
//                       <td>
//                         <Address address={seller as '0x${string}' | undefined} />
//                       </td>
//                       <td>{priceInEth} ETH</td>
//                       <td>{timestamp}</td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Transfers;


"use client";

import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { format } from "date-fns";
import { formatEther } from "viem";

interface TransfersProps {
  tokenid?: string;
}
// 使用useScaffoldEventHistory钩子获取NftPurchased事件历史
const Transfers: NextPage<TransfersProps> = ({ tokenid }) => {
  // 判断 tokenid 是否有效
  const tokenIdFilter = tokenid ? { tokenId: BigInt(tokenid) } : undefined;

  const { data: purchaseEvents, isLoading, error } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "NftPurchased",
    fromBlock: 0n,
    blockData: true,
    filters: tokenIdFilter,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-xl"></span>
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center mt-10">
        出错了。。
      </div>
    );

  console.log(purchaseEvents);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">
              All Transfers Events {tokenid ? `for Token ID: ${tokenid}` : ""}
            </span>
          </h1>
        </div>
        <div className="overflow-x-auto shadow-lg">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="bg-primary">Token Id</th>
                <th className="bg-primary">Buyer</th>
                <th className="bg-primary">Seller</th>
                <th className="bg-primary">Price</th>
                <th className="bg-primary">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {!purchaseEvents || purchaseEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center">
                    No events found
                  </td>
                </tr>
              ) : (
                purchaseEvents.map((event, index) => {
                  const tokenId = event.args.tokenId?.toString() ?? "N/A";
                  const buyer = event.args.buyer ?? "N/A";
                  const seller = event.args.seller ?? "N/A";
                  const priceInWei = event.args.price ?? 0n;
                  const priceInEth = formatEther(priceInWei);

                  const blocktimestamp = event.block?.timestamp;
                  const timestamp = blocktimestamp
                    ? format(new Date(Number(blocktimestamp) * 1000), "yyyy-MM-dd HH:mm:ss")
                    : "N/A";

                  return (
                    <tr key={index}>
                      <td className="text-center">{tokenId}</td>
                      <td>
                        <Address address={buyer as '0x${string}' | undefined} />
                      </td>
                      <td>
                        <Address address={seller as '0x${string}' | undefined} />
                      </td>
                      <td>{priceInEth} ETH</td>
                      <td>{timestamp}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Transfers;
