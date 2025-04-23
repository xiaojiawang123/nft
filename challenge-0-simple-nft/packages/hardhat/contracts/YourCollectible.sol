// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2; 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract YourCollectible is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard
{
    using Counters for Counters.Counter;

    Counters.Counter public tokenIdCounter;

    // 累计的上架费用
    uint256 public totalFeesCollected;

    struct NftItem {
        uint256 tokenId;
        uint256 price;
        address payable seller;
        bool isListed;
        string tokenUri;
        uint256 royaltyPercentage; // 存储每个NFT的版税百分比
         uint256 timestamp; // 铸币时间戳
    }
    //拍卖信息
   struct Auction {
    uint256 tokenId;
    uint256 minPrice;
    uint256 highestBid;
    address highestBidder;
     uint256 startTime; 
    uint256 endTime;
    bool active;
    string tokenUri;
    address auctionCreator; // 新增字段：拍卖发起者
}

 //租赁信息
     struct Rental {
        uint256 tokenId; // 添加tokenId字段
        address renter;        // 租户地址
        address owner;         // 拥有者地址 (实际拥有者)
        uint256 rentPrice;     // 租金
        uint256 deposit;       // 押金
        uint256 startTime;     // 租赁开始时间
        uint256 duration;      // 租赁时长
        bool active;           // 租赁状态
        string tokenUri;
        bool status;           // 是否上架租赁状态
    }

    // 盲盒结构
    struct BlindBox {
        uint256 id;              // 盲盒ID
        uint256 price;           // 盲盒价格
        address creator;         // 创建者地址
        uint256[] nftIds;        // 盲盒中包含的NFT ID数组
        bool active;             // 盲盒状态
        
    }
    // Token ID到NftItem的映射
    mapping(uint256 => NftItem) private _idToNftItem;
    // 确保每个tokenURI唯一
    mapping(string => bool) private _usedTokenURIs;

    // 维护所有上架的tokenId数组
    uint256[] private _listedTokenIds;
    // tokenId到_listedTokenIds数组索引的映射
    mapping(uint256 => uint256) private _tokenIdToListedIndex;

    // 上架费用比例（例如250代表2.5%）
    uint256 public listingFeePercentage = 250; // 2.5%
    uint256 public constant MAX_LISTING_FEE_PERCENTAGE = 1000; // 最多10%

    // 版税相关
    mapping(uint256 => address) private _creators; // 存储每个tokenId的创作者地址
    uint256 public royaltyPercentage = 500; // 版税百分比，默认设置为5%
    //租赁相关
    mapping(uint256 => Rental) public rentals; // 每个 tokenId 对应的租赁信息
     
    // 存储每个tokenId的NFT所有者
    mapping(uint256 => address) public nftOwners;
    // 存储每个tokenId的租赁押金
    mapping(uint256 => uint256) public deposits;
       // 存储盲盒信息
    mapping(uint256 => BlindBox) public blindBoxes;
    // 定义一个数组存储所有盲盒的 ID
uint256[] private blindBoxIds;
    // 事件
      event GasUsedForBatchMint(uint256 gasUsed); // 新增事件，用于返回 Gas 消耗值
    event NftListed(uint256 indexed tokenId, address indexed seller, uint256 price);      
    event NftUnlisted(uint256 indexed tokenId, address indexed seller);
    event NftPurchased(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event ListingFeePercentageUpdated(uint256 newListingFeePercentage);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event FeesReceived(address indexed sender, uint256 amount);
    event RentalCreated(uint256 indexed tokenId, address indexed renter, uint256 rentPrice, uint256 duration);
    event RentalEnded(uint256 tokenId, address renter, uint256 refundAmount);
    event RefundAmountSet(uint256 indexed tokenId, address indexed to, uint256 amount);
      // 事件：创建盲盒
    event BlindBoxCreated(uint256 boxId, uint256 price, address creator);
    // 事件：添加NFT到盲盒
    event NFTAddedToBlindBox(uint256 boxId, uint256 nftId);
     // 事件：购买盲盒
    event BlindBoxPurchased(uint256 boxId, uint256 nftId);
    constructor() ERC721("YourCollectible", "YCB") {}

    function _baseURI() internal pure override returns (string memory) {
        return "https://plum-tough-magpie-802.mypinata.cloud/ipfs/"; // 修改为你的IPFS网关地址
    }

/**
 * @dev 批量铸造新的NFT
 * @param to 接收者地址
 * @param uris 每个NFT的元数据URI数组
 * @param royaltyPercentages 每个NFT对应的版税百分比数组（例如500代表5%）
 * @return tokenIds 新铸造的NFT的Token ID数组
 */
function batchMintItems(
    address to,
    string[] memory uris,
    uint256[] memory royaltyPercentages,
    uint256[] memory price
) public returns (uint256[] memory tokenIds, uint256 gasUsed) { // 定义返回值
    require(uris.length == royaltyPercentages.length, "Mismatched inputs");
    require(uris.length > 0, "No URIs provided");

    tokenIds = new uint256[](uris.length); // 初始化返回数组

    // 记录初始剩余 Gas
    uint256 initialGas = gasleft();

    for (uint256 i = 0; i < uris.length; i++) {
        require(royaltyPercentages[i] <= 10000, "Royalty percentage cannot exceed 100%");

        tokenIdCounter.increment();
        uint256 tokenId = tokenIdCounter.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uris[i]);

        // 拼接完整的 tokenURI
        string memory completeTokenURI = string(abi.encodePacked(_baseURI(), uris[i]));

        // 获取当前时间戳
        uint256 currentTimestamp = block.timestamp;

        // 创建并存储 NftItem
        _idToNftItem[tokenId] = NftItem({
            tokenId: tokenId,
            price: price[i],
            seller: payable(address(0)),
            isListed: false,
            tokenUri: completeTokenURI,
            royaltyPercentage: royaltyPercentages[i],
            timestamp: currentTimestamp
        });

        // 保存创作者的地址和版税
        _creators[tokenId] = msg.sender;

        emit NftUnlisted(tokenId, address(0)); // 或其他适当的事件

        tokenIds[i] = tokenId; // 将 Token ID 添加到数组
    }

    // 计算实际消耗的 Gas
    gasUsed = initialGas - gasleft();

    return (tokenIds, gasUsed); // 返回两个值
}


    /**
     * @dev 将NFT上架
     * @param tokenId 要上架的NFT的Token ID
     * @param price 上架的价格，单位为wei
     */
    function placeNftOnSale(uint256 tokenId, uint256 price) external payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(ownerOf(tokenId) == msg.sender, "You are not the owner of this NFT");
        require(!_idToNftItem[tokenId].isListed, "Item is already on sale");
        require(msg.value == calculateListingFee(price), "Incorrect listing fee");
       // 将NFT从用户地址转移到合约地址
         _transfer(msg.sender, address(this), tokenId);

        // 更新NftItem信息
        _idToNftItem[tokenId] = NftItem({
            tokenId: tokenId,
            price: price,
            seller: payable(msg.sender),
            isListed: true,
            tokenUri: tokenURI(tokenId),
            royaltyPercentage: _idToNftItem[tokenId].royaltyPercentage, // 保持原版税比例
            timestamp: block.timestamp
        });

        // 将tokenId添加到listedTokenIds数组，并记录其索引
        _listedTokenIds.push(tokenId);
        _tokenIdToListedIndex[tokenId] = _listedTokenIds.length - 1;

        totalFeesCollected += msg.value;

        emit NftListed(tokenId, msg.sender, price);
    }

 /**
     * @dev 购买NFT
     * @param tokenId 要购买的NFT的Token ID
     */
    function purchaseNft(uint256 tokenId) external payable nonReentrant {
    NftItem storage item = _idToNftItem[tokenId];
    require(item.isListed, "Item is not listed for sale");
    require(msg.value >= item.price, "Payment must be exactly the price");
    require(item.seller != msg.sender, "You are the seller");

    // 取消上架并更新状态
    item.isListed = false;

    // 先转账给卖家，再更新seller地址
    address payable seller = item.seller; // 记录卖家的地址
    item.seller = payable(address(0)); // 重置卖家信息在转账之后
    

    // 从listedTokenIds数组中移除tokenId
    _removeFromListed(tokenId);

    // 将ETH转给卖家
    (bool success, ) = seller.call{value: msg.value}("");
    require(success, "Transfer to seller failed");

    // 将NFT转给买家
    _transfer(address(this), msg.sender, tokenId);

    emit NftPurchased(tokenId, msg.sender,seller,item.price);
}




    /**
     * @dev 获取NftItem信息
     * @param tokenId 要查询的NFT的Token ID
     * @return NftItem结构体
     */
    function getNftItem(uint256 tokenId) public view returns (NftItem memory) {
        return _idToNftItem[tokenId];
    }

    /**
     * @dev 设置新的上架费用比例（仅合约所有者可调用）
     * @param _newListingFeePercentage 新的上架费用比例（例如250代表2.5%）
     */
    function setListingFeePercentage(uint256 _newListingFeePercentage) external onlyOwner {
        require(_newListingFeePercentage <= MAX_LISTING_FEE_PERCENTAGE, "Listing fee cannot exceed 10%");
        listingFeePercentage = _newListingFeePercentage;
        emit ListingFeePercentageUpdated(_newListingFeePercentage);
    }

    /**
     * @dev 获取当前上架的NFT数量
     */
    function getListedItemsCount() external view returns (uint256) {
        return _listedTokenIds.length;
    }

    /**
     * @dev 从上架列表中移除tokenId
     * @param tokenId 要移除的tokenId
     */
    function _removeFromListed(uint256 tokenId) internal {
        uint256 index = _tokenIdToListedIndex[tokenId];
        uint256 lastTokenId = _listedTokenIds[_listedTokenIds.length - 1];

        // 将要移除的tokenId与最后一个tokenId交换
        _listedTokenIds[index] = lastTokenId;
        _tokenIdToListedIndex[lastTokenId] = index;

        // 删除最后一个元素
        _listedTokenIds.pop();

        // 删除映射中的条目
        delete _tokenIdToListedIndex[tokenId];
    }

    /**
     * @dev 获取所有上架的NFT
     * @return An array of NftItem structs
     */
    function getAllListedNfts() external view returns (NftItem[] memory) {
    uint256 totalListed = _listedTokenIds.length;
    uint256 listedCount = 0;

    // 首先，计算出上架的 NFT 数量
    for (uint256 i = 0; i < totalListed; i++) {
        uint256 tokenId = _listedTokenIds[i];
        if (_idToNftItem[tokenId].isListed) {
            listedCount++;
        }
    }

    // 创建一个新的数组来存储上架的 NFT
    NftItem[] memory items = new NftItem[](listedCount);
    uint256 index = 0;

    // 将上架的 NFT 添加到返回的数组中
    for (uint256 i = 0; i < totalListed; i++) {
        uint256 tokenId = _listedTokenIds[i];
        if (_idToNftItem[tokenId].isListed) {
            items[index] = _idToNftItem[tokenId];
            index++;
        }
    }
    return items;
}
function unlistNft(uint256 tokenId) external nonReentrant {
    // 检查 NFT 是否已上架
    require(_idToNftItem[tokenId].isListed, "NFT is not listed");

    // 获取卖家地址
    address seller = _idToNftItem[tokenId].seller;

    // 检查调用者是否有权限下架，只允许卖家下架
    require(msg.sender == seller, "Only the seller can unlist the NFT");

    // 将该 NFT 的 isListed 标记为 false
    _idToNftItem[tokenId].isListed = false;

    // 在 _listedTokenIds 数组中移除该 tokenId
    uint256 totalListed = _listedTokenIds.length;
    bool found = false;

    for (uint256 i = 0; i < totalListed; i++) {
        if (_listedTokenIds[i] == tokenId) {
            // 将找到的元素与数组中的最后一个元素交换
            _listedTokenIds[i] = _listedTokenIds[totalListed - 1];
            // 删除数组最后一个元素
            _listedTokenIds.pop();
            found = true;
            break;
        }
    }

    // 如果没有找到 tokenId，则抛出异常
    require(found, "Token ID not found in listed NFTs");

    // 将 NFT 从合约地址转回卖家地址
    _transfer(address(this), seller, tokenId);

    // 触发事件通知下架
    emit NftUnlisted(tokenId, seller);
}


event NftUnlisted(uint256 tokenId);

    /**
     * @dev 计算上架费用
     * @param priceInWei NFT的售价，单位为wei
     * @return fee 上架费用，单位为wei
     */
    function calculateListingFee(uint256 priceInWei) public view returns (uint256) {
        uint256 fee = (priceInWei * listingFeePercentage) / 10000;
        return fee;
    }

    /**
     * @dev 提现累积的上架费用（仅合约所有者可调用）
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = totalFeesCollected;
        require(amount > 0, "No fees to withdraw");

        totalFeesCollected = 0;

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FeesWithdrawn(owner(), amount);
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

 function getRoyaltyPercentage(uint256 tokenId) external view returns (uint256) {
        NftItem storage item = _idToNftItem[tokenId];
        return item.royaltyPercentage;  // 返回指定 tokenId 对应的版税百分比
    }
    /**
     * @dev 设置新的版税百分比（仅合约所有者可调用）
     * @param percentage 新的版税百分比
     */
    function setRoyaltyPercentage(uint256 percentage) public onlyOwner {
        royaltyPercentage = percentage;
    }
    // 新增：竞拍功能

  // 存储所有正在竞拍的 NFT Token ID
uint256[] private _auctionTokenIds;

   // 存储每个 tokenId 的竞拍信息
mapping(uint256 => Auction) public auctions;
event AuctionCreated(
    uint256 indexed tokenId, // NFT 的 Token ID
    address indexed creator, // 拍卖发起者
    uint256 minPrice,        // 最低价格
    uint256 endTime,         // 拍卖结束时间
    string tokenUri          // NFT 的元数据 URI
);

/**
 * @dev 发起一个新的拍卖
 * @param tokenId 要拍卖的NFT的Token ID
 * @param minPrice 拍卖的最低价格（以 wei 为单位）
 * @param duration 拍卖持续时间，以秒为单位
 */
function createAuction(uint256 tokenId, uint256 minPrice, uint256 duration) public {
    // 检查调用者是否为 NFT 的拥有者
    require(ownerOf(tokenId) == msg.sender, "Only the owner can create an auction");

    // 确保 NFT 未被列出或已拍卖
    require(!auctions[tokenId].active, "This NFT is already in an active auction");

    // 检查最低价格和拍卖时间是否合理
    require(minPrice > 0, "Minimum price must be greater than zero");
    require(duration > 0, "Auction duration must be greater than zero");

    // 获取完整的 tokenURI
    string memory tokenUri = tokenURI(tokenId);

    // 获取当前时间戳作为拍卖的开始时间
    uint256 startTime = block.timestamp;

    // 计算拍卖结束时间
    uint256 endTime = startTime + duration;

    // 创建并存储拍卖信息
    auctions[tokenId] = Auction({
        tokenId: tokenId,
        minPrice: minPrice,
        highestBid: 0, // 初始化为0，因为拍卖刚开始
        highestBidder: address(0), // 尚无最高出价者
        startTime: startTime,  // 存储拍卖的开始时间
        endTime: endTime,      // 存储拍卖的结束时间
        active: true,          // 标记拍卖为活跃状态
        tokenUri: tokenUri,    // 存储 NFT 的元数据 URI
        auctionCreator: msg.sender // 记录拍卖创建者
    });

    // 更新 NFT 项目信息中的拍卖状态
    _idToNftItem[tokenId].isListed = true;

    // 将 Token ID 添加到拍卖列表
    _auctionTokenIds.push(tokenId);

    // 触发拍卖创建事件
    emit AuctionCreated(
        tokenId,
        msg.sender,
        minPrice,
        endTime,  // 在事件中也传递结束时间
        tokenUri
    );
}





/**
     * @dev 根据状态获取正在竞拍的NFT信息
     * @param _active 是否正在竞拍（true 为正在竞拍，false 为已结束）
     * @return Auction[] 符合条件的拍卖信息数组
     */
    function getAuctionsByStatus(bool _active) public view returns (Auction[] memory) {
        uint256 auctionCount = 0;

        // 计算符合状态的拍卖数量
        for (uint256 i = 0; i < _auctionTokenIds.length; i++) {
            uint256 tokenId = _auctionTokenIds[i];
            if (auctions[tokenId].active == _active) {
                auctionCount++;
            }
        }

        // 创建一个存储符合状态的拍卖信息数组
        Auction[] memory filteredAuctions = new Auction[](auctionCount);
        uint256 index = 0;

        // 填充符合状态的拍卖信息
        for (uint256 i = 0; i < _auctionTokenIds.length; i++) {
            uint256 tokenId = _auctionTokenIds[i];
            if (auctions[tokenId].active == _active) {
                filteredAuctions[index] = auctions[tokenId];
                index++;
            }
        }

        return filteredAuctions;
    }

/**
 * @dev 出价参与拍卖
 * @param tokenId 要出价的NFT的Token ID
 */
function bid(uint256 tokenId) public payable {
    Auction storage auction = auctions[tokenId];
    require(auction.active, "The auction is inactive");
    require(block.timestamp < auction.endTime, "The auction has ended");
    require(msg.value > auction.highestBid, "The bid is lower than the current maximum bid");

    // 退还之前的最高出价者
    if (auction.highestBidder != address(0)) {
        payable(auction.highestBidder).transfer(auction.highestBid);
    }

    // 更新最高出价者和出价
    auction.highestBid = msg.value;
    auction.highestBidder = msg.sender;
}


/**
 * @dev 结束拍卖（允许提前结束，但仅限拍卖创建者）
 * @param tokenId 要结束拍卖的NFT的Token ID
 */
function endAuction(uint256 tokenId) public {
    Auction storage auction = auctions[tokenId];
    require(auction.active, "The auction has already ended");
    require(
        block.timestamp >= auction.endTime || msg.sender == auction.auctionCreator,
        "Only the creator can end the auction early"
    );

    auction.active = false;

    if (auction.highestBidder != address(0)) {
        // 将NFT转给最高出价者并将拍卖资金转给卖家
        _transfer(ownerOf(tokenId), auction.highestBidder, tokenId);
        payable(auction.auctionCreator).transfer(auction.highestBid);
    }
     // 无论是否有出价者，都将 NFT 设置为未上架状态
    _idToNftItem[tokenId].isListed = false;
    // 清除拍卖信息，确保不会重复显示拍卖信息
    auction.highestBid = 0;
    auction.highestBidder = address(0);
    auction.endTime = 0;
}

// 声明一个数组来存储所有tokenId
uint256[] public allTokenIds;

// 获取租赁数据根据状态
function getRentalDataByStatus(bool status) public view returns (Rental[] memory) {
    uint256 count = 0;

    // 计算符合状态的NFT数量
    for (uint256 i = 0; i < allTokenIds.length; i++) {
        // 检查是否符合 status 状态，即租赁是否上架
        if (rentals[allTokenIds[i]].status == status) {
            count++;
        }
    }

    // 创建一个数组来存储符合状态的租赁信息
    Rental[] memory result = new Rental[](count);
    uint256 index = 0;

    // 填充结果数组
    for (uint256 i = 0; i < allTokenIds.length; i++) {
        // 检查是否符合 status 状态，即租赁是否上架
        if (rentals[allTokenIds[i]].status == status) {
            result[index] = rentals[allTokenIds[i]];
            index++;
        }
    }

    return result;
}

  // 创建租赁
function createRental(
    uint256 tokenId, 
    uint256 rentPrice, 
    uint256 deposit, 
    uint256 duration 
    
) public {
    // 确保调用者是 NFT 的拥有者
    require(ownerOf(tokenId) == msg.sender, "Only NFT owners can rent out");
    
    // 确保该 NFT 尚未被租赁
    require(!rentals[tokenId].active, "The NFT has been rented out");

// 获取完整的 tokenURI
    string memory tokenUri = tokenURI(tokenId);
    // 创建租赁信息并存储
    rentals[tokenId] = Rental({
        tokenId: tokenId,
        renter: address(0),
        owner: msg.sender,    // 记录NFT的实际拥有者
        rentPrice: rentPrice,
        deposit: deposit,
        startTime: 0,
        duration: duration,
        active: true,
        status: true,
        tokenUri: tokenUri // 存储 tokenUri
    });

    // 将 tokenId 添加到 allTokenIds 数组中
    allTokenIds.push(tokenId);
}


    // 租用NFT
    function rentNFT(uint256 tokenId) public payable {
        Rental storage rental = rentals[tokenId];
        require(rental.active, "The NFT is not rentable");
        require(rental.status, "The NFT is not available for rent");
        require(msg.value == rental.rentPrice + rental.deposit, "The rent and deposit paid were incorrect");

        rental.renter = msg.sender;
        rental.startTime = block.timestamp;

        // 临时转移NFT的所有权给租用者
        _transfer(rental.owner, msg.sender, tokenId);  // 将NFT的所有权转移给租户

        // 支付租金给NFT持有者
        payable(rental.owner).transfer(rental.rentPrice);
         rental.status = false;
    }

    // 结束租赁并归还NFT
    function endRental(uint256 tokenId) public {
        Rental storage rental = rentals[tokenId];
        require(rental.active, "The NFT is not rented");
       
        require(rental.renter == msg.sender, "Only tenants can end a lease");

        uint256 refundAmount = 0;

        // 租户提前归还，或租赁期结束
        if (block.timestamp <= rental.startTime + rental.duration) {
            // 租户按时归还或提前归还，退还押金
            refundAmount = rental.deposit;
            emit RefundAmountSet(tokenId, rental.renter, refundAmount);
            
        } else {
            // 租户未按时归还，押金被没收
            refundAmount = 0;
            emit RefundAmountSet(tokenId, rental.renter, refundAmount);
        }

        // 归还NFT给所有者
        _transfer(rental.renter, rental.owner, tokenId);  // 将NFT的所有权归还给实际拥有者

        

        // 退还押金
        if (refundAmount > 0) {
            // 确保合约有足够的余额支付押金
            payable(rental.renter).transfer(refundAmount);
            
        }
// 重置租赁信息
        rental.renter = address(0);
        rental.startTime = 0;
        rental.active = false;
       
        // 触发事件来调试
        emit RentalEnded(tokenId, rental.renter, refundAmount);
    }

    
 // 根据租赁上架状态查询所有活跃的NFT租赁信息
function getActiveRentalData() public view returns (Rental[] memory) {
    uint256 count = 0;

    // 计算活跃租赁的NFT数量
    for (uint256 i = 0; i < allTokenIds.length; i++) {
        if (rentals[allTokenIds[i]].status == true) {
            count++;
        }
    }

    // 创建一个数组来存储符合状态的租赁信息
    Rental[] memory result = new Rental[](count);
    uint256 index = 0;

    // 填充结果数组
    for (uint256 i = 0; i < allTokenIds.length; i++) {
        if (rentals[allTokenIds[i]].status == true) {
            result[index] = rentals[allTokenIds[i]];
            index++;
        }
    }

    return result;
}

  
 function createBlindBox(uint256 _id, uint256 _price) external {
        // 确保盲盒ID没有被使用
        require(blindBoxes[_id].id == 0, "Blind box already exists");

        // 创建新的盲盒
        BlindBox storage newBox = blindBoxes[_id];
        newBox.id = _id;
        newBox.price = _price;
        newBox.creator = msg.sender; // 创建者为调用者地址
        newBox.active = true;        // 设置盲盒为激活状态
          // 将盲盒 ID 添加到盲盒 ID 数组
         blindBoxIds.push(_id);
        // 触发事件，通知盲盒创建成功
        emit BlindBoxCreated(_id, _price, msg.sender);
    }


// 向盲盒中添加NFT
function addNFTToBlindBox(uint256 _boxId, uint256 tokenId) external payable {
    BlindBox storage box = blindBoxes[_boxId];
    require(box.id != 0, "Blind box does not exist");
    require(ownerOf(tokenId) == msg.sender, "You are not the owner of this NFT");  // 确保是NFT所有者
    // 确保只有创建者才可以向盲盒添加NFT
        require(box.creator == msg.sender, "You are not the creator of this blind box");
    // 将NFT从用户地址转移到合约地址
    _transfer(msg.sender, address(this), tokenId);  // 或者使用 safeTransferFrom，根据合约的实现

    // 添加NFT到盲盒
    box.nftIds.push(tokenId);
    
    emit NFTAddedToBlindBox(_boxId, tokenId);
}

// 购买盲盒
function buyMysteryBox(uint256 _boxId) external payable returns (uint256) {
    BlindBox storage box = blindBoxes[_boxId];
    require(box.id != 0, "Blind box does not exist");
    require(msg.value == box.price, "Incorrect price");
    
    uint256 nftCount = box.nftIds.length;
    require(nftCount > 0, "No NFTs available in this box");

    // 随机选择一个NFT
    uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % nftCount;
    uint256 tokenId = box.nftIds[randomIndex];

    // 从盲盒中移除该NFT
    box.nftIds[randomIndex] = box.nftIds[nftCount - 1];
    box.nftIds.pop();

    // 将ETH转给卖家（假设卖家的信息已经记录在某个地方，可以根据需要调整）
    // 这里假设卖家是盲盒的创建者或某个已记录的地址
    address payable seller = payable(address(0)); // 这里假设卖家是盲盒的创建者，改成实际地址

    // 转账ETH给卖家
    (bool success, ) = seller.call{value: msg.value}("");
    require(success, "Transfer to seller failed");

    // 将NFT转给购买者
    _transfer(address(this), msg.sender, tokenId);

    emit BlindBoxPurchased(_boxId, tokenId);

    return tokenId;
}



// 获取盲盒的NFT数量
function getBlindBoxCount(uint256 _id) external view returns (uint256) {
    return blindBoxes[_id].nftIds.length;
}
// 添加一个获取盲盒信息的函数
function getBlindBoxInfo(uint256 _id) external view returns (
    uint256 id, 
    uint256 price, 
    address creator, 
    bool active, 
    uint256 nftCount
) {
    BlindBox storage box = blindBoxes[_id];
    
    // 确保盲盒存在
    require(box.id != 0, "Blind box does not exist");

    // 返回盲盒信息
    return (box.id, box.price, box.creator, box.active, box.nftIds.length);
}
// 获取所有盲盒 ID 的方法
function getAllBlindBoxIds() external view returns (uint256[] memory) {
    return blindBoxIds;
}
// 根据盲盒状态获取所有盲盒的信息
function getBlindBoxesByStatus(bool _active) external view returns (
    uint256[] memory ids, 
    uint256[] memory prices, 
    address[] memory creators, 
    bool[] memory actives, 
    uint256[] memory nftCounts
) {
    uint256 totalBlindBoxes = blindBoxIds.length;
    uint256 count = 0;

    // 统计符合状态条件的盲盒数量
    for (uint256 i = 0; i < totalBlindBoxes; i++) {
        BlindBox storage box = blindBoxes[blindBoxIds[i]];
        if (box.active == _active) {
            count++;
        }
    }

    // 初始化返回数组的长度为符合状态条件的盲盒数量
    ids = new uint256[](count);
    prices = new uint256[](count);
    creators = new address[](count);
    actives = new bool[](count);
    nftCounts = new uint256[](count);

    // 将符合状态条件的盲盒信息填充到返回数组中
    uint256 index = 0;
    for (uint256 i = 0; i < totalBlindBoxes; i++) {
        BlindBox storage box = blindBoxes[blindBoxIds[i]];
        if (box.active == _active) {
            ids[index] = box.id;
            prices[index] = box.price;
            creators[index] = box.creator;
            actives[index] = box.active;
            nftCounts[index] = box.nftIds.length;
            index++;
        }
    }

    return (ids, prices, creators, actives, nftCounts);
}

  }