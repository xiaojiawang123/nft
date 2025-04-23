"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { data: myTotalBalance } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "balanceOf",
    args: [connectedAddress],
    watch: true,
  });

  useEffect(() => {
    const updateMyCollectibles = async (): Promise<void> => {
      if (myTotalBalance === undefined || yourCollectibleContract === undefined || connectedAddress === undefined)
        return;

      setAllCollectiblesLoading(true);
      const collectibleUpdate: Collectible[] = [];
      const totalBalance = parseInt(myTotalBalance.toString());
      for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
        try {
          const tokenId = await yourCollectibleContract.read.tokenOfOwnerByIndex([
            connectedAddress,
            BigInt(tokenIndex),
          ]);
          console.log("tokenId === " + tokenId);

          const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
          console.log("token uri === " + tokenURI);

          // 将 IPFS URI 替换为 Pinata 网关地址
          const tokenURIWithGateway = tokenURI.replace("ipfs://", "https://plum-tough-magpie-802.mypinata.cloud/ipfs/");

          const nftMetadata: NFTMetaData = await getMetadataFromIPFS(tokenURIWithGateway as string);
          console.log("nftMetadata === " + JSON.stringify(nftMetadata));

          collectibleUpdate.push({
            id: parseInt(tokenId.toString()),
            uri: tokenURIWithGateway as string,
            owner: connectedAddress,
            ...nftMetadata,
          });
        } catch (e) {
          notification.error("Error fetching all collectibles");
          setAllCollectiblesLoading(false);
          console.log(e);
        }
      }
      collectibleUpdate.sort((a, b) => a.id - b.id);
      setMyAllCollectibles(collectibleUpdate);
      setAllCollectiblesLoading(false);
    };

    updateMyCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, myTotalBalance]);

  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>
      {myAllCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">No NFTs found</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {myAllCollectibles.map(item => (
            <NFTCard nft={item} key={item.id} />
          ))}
        </div>
      )}
    </>
  );
};

// "use client";

// import { useEffect, useState } from "react";
// import { NFTCard } from "./NFTCard";
// import { useAccount } from "wagmi";
// import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
// import { notification } from "~~/utils/scaffold-eth";
// import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
// import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";

// export interface Collectible extends Partial<NFTMetaData> {
//   id: number;
//   uri: string;
//   owner: string;
// }

// export const MyHoldings = () => {
//   const { address: connectedAddress } = useAccount();
//   const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
//   const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);

//   const { data: yourCollectibleContract } = useScaffoldContract({
//     contractName: "YourCollectible",
//   });

//   const { data: myTotalBalance } = useScaffoldReadContract({
//     contractName: "YourCollectible",
//     functionName: "balanceOf",
//     args: [connectedAddress],
//     watch: true,
//   });

//   useEffect(() => {
//     const updateMyCollectibles = async (): Promise<void> => {
//       if (myTotalBalance === undefined || yourCollectibleContract === undefined || connectedAddress === undefined)
//         return;

//       setAllCollectiblesLoading(true);
//       const collectibleUpdate: Collectible[] = [];
//       const totalBalance = parseInt(myTotalBalance.toString());
//       for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
//         try {
//           const tokenId = await yourCollectibleContract.read.tokenOfOwnerByIndex([
//             connectedAddress,
//             BigInt(tokenIndex),
//           ]);
//           console.log("tokenId === "+tokenId)
          
//           const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
//           console.log("token uri === "+tokenURI)

//           // const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");

//           const nftMetadata: NFTMetaData = await getMetadataFromIPFS(tokenURI as string);
//           console.log("nftMetadata === "+JSON.stringify(nftMetadata))

//           collectibleUpdate.push({
//             id: parseInt(tokenId.toString()),
//             uri: tokenURI as string,
//             owner: connectedAddress,
//             ...nftMetadata,
//           });
//         } catch (e) {
//           notification.error("Error fetching all collectibles");
//           setAllCollectiblesLoading(false);
//           console.log(e);
//         }
//       }
//       collectibleUpdate.sort((a, b) => a.id - b.id);
//       setMyAllCollectibles(collectibleUpdate);
//       setAllCollectiblesLoading(false);
//     };

//     updateMyCollectibles();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [connectedAddress, myTotalBalance]);

//   if (allCollectiblesLoading)
//     return (
//       <div className="flex justify-center items-center mt-10">
//         <span className="loading loading-spinner loading-lg"></span>
//       </div>
//     );

//   return (
//     <>
//       {myAllCollectibles.length === 0 ? (
//         <div className="flex justify-center items-center mt-10">
//           <div className="text-2xl text-primary-content">No NFTs found</div>
//         </div>
//       ) : (
//         <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
//           {myAllCollectibles.map(item => (
//             <NFTCard nft={item} key={item.id} />
//           ))}
//         </div>
//       )}
//     </>
//   );
// };
