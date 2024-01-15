const pancakeSwapAbi = require("./pancakeswap-abi.json");
const Web3 = require("web3");
require("dotenv").config();

const BNBTokenAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDTokenAddress = "0x55d398326f99059fF775485246999027B3197955";
const pancakeSwapContract = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const web3 = new Web3("https://bsc-dataseed1.binance.org");

const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

async function buyToken(targetTokenAddress, amountBNB, slippage) {
  const router = new web3.eth.Contract(
    pancakeSwapAbi,
    pancakeSwapRouterAddress
  );

  const amountOutMin = "0"; // You need to calculate this based on the slippage
  const path = [BNBTokenAddress, targetTokenAddress];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current time

  const tx = router.methods.swapExactETHForTokens(
    amountOutMin,
    path,
    account.address,
    deadline
  );

  const gas = await tx.estimateGas({ from: account.address, value: amountBNB });
  const gasPrice = await web3.eth.getGasPrice();

  const data = tx.encodeABI();
  const nonce = await web3.eth.getTransactionCount(account.address);

  const signedTx = await web3.eth.accounts.signTransaction(
    {
      from: account.address,
      to: pancakeSwapRouterAddress,
      data,
      gas,
      gasPrice,
      nonce,
      value: amountBNB,
    },
    account.privateKey
  );

  return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

async function getTokenPrice(tokenAddres) {
  const amountInWei = web3.utils.toWei("1", "ether");
  let amountOut;
  try {
    let router = await new web3.eth.Contract(
      pancakeSwapAbi,
      pancakeSwapContract
    );
    amountOut = await router.methods
      .getAmountsOut(amountInWei, [tokenAddres, BNBTokenAddress])
      .call();
    amountOut = web3.utils.fromWei(amountOut[1]);
  } catch (error) {
    console.log(error);
  }

  if (!amountOut) return 0;
  return amountOut;
}

async function getBnbPrice() {
  const bnbAmountInWei = web3.utils.toWei("1", "ether");
  let amountOut;
  try {
    const router = await new web3.eth.Contract(
      pancakeSwapAbi,
      pancakeSwapContract
    );
    amountOut = await router.methods
      .getAmountsOut(bnbAmountInWei, [BNBTokenAddress, USDTokenAddress])
      .call();
    amountOut = web3.utils.fromWei(amountOut[1]);
  } catch (error) {
    console.log(error);
  }
  if (!amountOut) return 0;
  return amountOut;
}

(async () => {
  const tokenAddres = "0x2D060Ef4d6BF7f9e5edDe373Ab735513c0e4F944";
  const bnbPrice = await getBnbPrice();
  console.log(`CURRENT BNB PRICE: ${bnbPrice}`);
  const priceInBnb = await getTokenPrice(tokenAddres);
  //const priceInUsdt = priceInBnb * bnbPrice;

  //TODO
  try {
    const receipt = await buyToken(tokenAddres, web3.utils.toWei("0.01"), 0.5);
    console.log("Transaction receipt:", receipt);
  } catch (error) {
    console.error("Error in transaction:", error);
  }
})();
