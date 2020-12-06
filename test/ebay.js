const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const Ebay = artifacts.require('Ebay');

contract('Ebay', (accounts) => {
  let ebay;
  const auction = {
    name: 'auction1',
    description: 'Selling item1',
    min: 10,
    duration: 86400 + 1
  };
  const [seller, buyer1, buyer2] = [accounts[0], accounts[1], accounts[2]];
  beforeEach(async () => {
    ebay = await Ebay.new();
  });

  it(
    'should NOT create a new auction if duration is not between 1-10 days', async () => {
      
      await expectRevert(
        ebay.createAuction('auction1', 'Selling item1', 10, 864001),
        '_duration must be comprised between 1 to 10 days'
      );
      await expectRevert(
        ebay.createAuction('auction1', 'Selling item1', 10, 1),
        '_duration must be comprised between 1 to 10 days'
      );
  })

  it('should create an auction', async() => {
    let auctions;
    // const now = parseInt((new Date()).getTime() / 1000);
    // time.increaseTo(now);

    await ebay.createAuction(auction.name, auction.description, auction.min, auction.duration, {from: seller});
    
    auctions = await ebay.getUserAuctions(seller);
    assert(auctions.length === 1)
    assert(auctions[0].name === auction.name);
    assert(auctions[0].seller === seller);
    assert(parseInt(auctions[0].id) === 1); //USER PARSEINT INSTEAD OF TONUMBER()
    assert(auctions[0].description === auction.description);
    assert(parseInt(auctions[0].min) === auction.min);
    // assert(parseInt(auctions[0].end) === now + auction.duration);
    
    auctions = await ebay.getAuctions();
    assert(auctions.length === 1)
    assert(auctions[0].seller === seller);
    assert(parseInt(auctions[0].id) === 1); //USER PARSEINT INSTEAD OF TONUMBER()
    assert(auctions[0].description === auction.description);
    assert(parseInt(auctions[0].min) === auction.min);
    assert(auctions[0].name === auction.name);

  });

  it('should NOT create offer if auction does not exist', async () => {
    await expectRevert(
      ebay.createOffer(1),
      'Auction does not exist'
    );
  });

  it('should NOT create offer if auction has expired', async () => {
    await ebay.createAuction(auction.name, auction.description, auction.min, auction.duration, {from: seller});
    time.increase(86402);
    
    await expectRevert(
      ebay.createOffer(1),
      'Auction has expired'
      );
    });
    
  it('should NOT create offer if price too low', async () => {
    await ebay.createAuction(auction.name, auction.description, auction.min, auction.duration, {from: seller});
    await expectRevert(
      ebay.createOffer(1, {from: buyer1, value: auction.min - 1}),
      'msg.value must be superior to min and bestOffer'
      );
      
    await ebay.createOffer(1, {from: buyer1, value: auction.min + 1});
    await expectRevert(
      ebay.createOffer(1, {from: buyer2, value: auction.min}),
      'msg.value must be superior to min and bestOffer'
      );
    });
    
  it('should create offer', async () => {
    await ebay.createAuction(auction.name, auction.description, auction.min, auction.duration, {from: seller});
    await ebay.createOffer(1, {from: buyer1, value: auction.min})

    const userOffer = await ebay.getUserOffers(buyer1);
    assert(userOffer.length === 1);
    assert(parseInt(userOffer[0].id) === 1);
    assert(parseInt(userOffer[0].auctionId) === 1);
    assert(userOffer[0].buyer === buyer1);
    assert(parseInt(userOffer[0].price) === auction.min)
  });

  it('should NOT trade if auction does not exist', async () => {
    await expectRevert(
      ebay.trade(1),
      'Auction does not exist'
    )
  });

  it('should trade', async () => {
    const bestPrice = web3.utils.toBN(auction.min + 10);
    await ebay.createAuction(auction.name, auction.description, auction.min, auction.duration, {from: seller});
    await ebay.createOffer(1, {from: buyer1, value: auction.min});
    await ebay.createOffer(1, {from: buyer2, value: bestPrice});
    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(seller));
    await ebay.trade(1, {from: accounts[9]});
    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(seller));
    assert(balanceAfter.sub(balanceBefore).eq(bestPrice));
  });

// it('should NOT trade if auction does not exist', async () => { //TESTING 
//   const _name = await ebay.nextAuctionId();
//   assert(parseInt(_name) === 1)
//   });
});
