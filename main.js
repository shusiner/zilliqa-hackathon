const { BN, Long, bytes, units } = require("@zilliqa-js/util");
const { Zilliqa } = require("@zilliqa-js/zilliqa");
const {
  toBech32Address,
  getAddressFromPrivateKey,
  fromBech32Address,
} = require("@zilliqa-js/crypto");
require("dotenv").config();

const zilliqa = new Zilliqa("https://dev-api.zilliqa.com");

const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

// Populate the wallet with an account
const privateKey = process.env.ZIL_PRIVATE_KEY;

zilliqa.wallet.addByPrivateKey(privateKey);

const address = getAddressFromPrivateKey(privateKey);
console.log(`My account address is: ${address}`);
const bech32Address = toBech32Address(address);
console.log(`My account bech32 address is: ${bech32Address}`);

function parseHrtimeToSeconds(hrtime) {
  var seconds = (hrtime[0] + hrtime[1] / 1e9).toFixed(3);
  return seconds;
}

function checkValidBech32Address(address) {
  return address.slice(0, 4) == "zil1";
}

async function mint_wokn_nft(
  to,
  token_uri,
  merchant,
  product_sku_code,
  organisation,
  unit_purchase,
  purchase_price
) {
  try {
    var startTime = process.hrtime();
    const myGasPrice = units.toQa("2000", units.Units.Li);
    console.log(`Waiting transaction be confirmed`);
    const deployedContract = zilliqa.contracts.at(
      process.env.DEPLOYED_CONTRACT
    );
    if (!to || !checkValidBech32Address(to)) {
      return false;
    }
    const callTx = await deployedContract.call(
      "Mint",
      [
        {
          vname: "to",
          type: "ByStr20",
          value: fromBech32Address(to),
        },
        {
          vname: "token_uri",
          type: "String",
          value: token_uri,
        },
        {
          vname: "merchant",
          type: "String",
          value: merchant,
        },
        {
          vname: "product_sku_code",
          type: "String",
          value: product_sku_code,
        },
        {
          vname: "organisation",
          type: "String",
          value: organisation,
        },
        {
          vname: "unit_purchase",
          type: "String",
          value: unit_purchase,
        },
        {
          vname: "purchase_price",
          type: "String",
          value: purchase_price,
        },
      ],
      {
        // amount, gasPrice and gasLimit must be explicitly provided
        version: VERSION,
        amount: new BN(0),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(80000),
      },
      33,
      1000,
      false
    );

    console.log(`Transaction confirmed`);
    console.log(`The transaction id is:`, callTx.id);
    console.log(callTx.receipt);
    var elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
    console.log("It takes " + elapsedSeconds + "seconds");
    return callTx.id;
  } catch (err) {
    console.log(err);
  }
}

mint_wokn_nft(
  bech32Address,
  "wokn.co",
  "The Reformative",
  "1234",
  "RF",
  "1",
  "100"
)
  .then((tx_id) => {
    console.log(tx_id);
  })
  .catch((error) => {
    console.error(error.message);
  });

// this part is for deployment in google cloud function
if (!process.env.LOCAL) {
  exports.bc = (req, res) => {
    let to = req.query.to;
    let token_uri = req.query.token_uri;
    let merchant = req.query.merchant;
    let product_sku_code = req.query.product_sku_code;
    let organisation = req.query.organisation;
    let unit_purchase = req.query.unit_purchase;
    let purchase_price = req.query.purchase_price;
    mint_wokn_nft(
      to,
      token_uri,
      merchant,
      product_sku_code,
      organisation,
      unit_purchase,
      purchase_price
    )
      .then((tx_id) => {
        res.status(200).send(tx_id);
      })
      .catch((error) => {
        console.error(error.message);
        res.status(400).send(error.message);
      });
  };
}
