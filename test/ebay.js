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

 
});
