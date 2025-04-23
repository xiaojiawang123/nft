const fetchFromApi = ({ path, method, body }: { path: string; method: string; body?: object }) =>
  fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then(response => response.json())
    .catch(error => console.error("Error:", error));

export const addToIPFS = (yourJSON: object) => fetchFromApi({ path: "/api/ipfs/add", method: "Post", body: yourJSON });


export const getMetadataFromIPFS = async (tokenURI: string) => {
   fetchFromApi({ path: "/api/ipfs/get-metadata", method: "Post", body: { ipfsHash:tokenURI } });

  try {

    const response = await fetch(tokenURI);
    if (!response.ok) {
      throw new Error(`HTTP error! status:${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching metadata from pinata', error);
    throw error;
  };
}



// export const getMetadataFromIPFS = async (tokenURI: string) => {
//   try {
//     const response = await fetchFromApi({ path: "/api/ipfs/get-metadata", method: "Post", body: { ipfsHash: tokenURI } });
//     return response;
//   } catch (error) {
//     console.error("Error fetching metadata from Pinata via API:", error);
//     throw error;
//   }
// };
// export const getMetadataFromIPFS = async (tokenURI: string) => {
//   // 假设 `fetchFromApi` 需要调用某个API，但没有返回值，直接调用它
//   await fetchFromApi({ path: "/api/ipfs/get-metadata", method: "POST", body: { ipfsHash: tokenURI } });

//   try {
//     const response = await fetch(tokenURI);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     return data; // 返回从 IPFS 获取的元数据
//   } catch (error) {
//     console.error('Error fetching metadata from IPFS', error);
//     throw error; // 抛出错误，以便调用者可以处理
//   }
// };
