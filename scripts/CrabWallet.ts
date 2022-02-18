import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers } from "hardhat"
import { TUSContract, JoePair,TUSContract__factory, JoePair__factory, CRAContract__factory, CRAMContract__factory, CRAContract, CRAMContract } from "../typechain";

type TokenBalance = {
  balance: string;
  balanceInUSD: string;
  USDPerToken: string;
}

const TUS_CONTRACT_ADDRESS = '0xf693248F96Fe03422FEa95aC0aFbBBc4a8FdD172'
const TUS_WAVAX_LP_ADDRESS = '0x565d20BD591b00EAD0C927e4b6D7DD8A33b0B319'
const WAVAX_MIM_LP_ADDRESS = '0x781655d802670bbA3c89aeBaaEa59D3182fD755D'

const CRA_CONTRACT_ADDRESS = '0xA32608e873F9DdEF944B24798db69d80Bbb4d1ed'
const CRA_WAVAX_LP_ADDRESS = '0x140cac5f0e05cbec857e65353839fddd0d8482c1'

class CrabWallet {
  private readonly wavaxMIMLPContract: JoePair;
  private readonly tusContract: TUSContract;
  private readonly tusWavaxLPContract: JoePair;
  private readonly craContract: CRAContract;
  private readonly craWavaxLPContract: JoePair;
  private readonly crabWallet: SignerWithAddress;

  constructor(myWallet: SignerWithAddress) {
    	this.wavaxMIMLPContract = new ethers.Contract(WAVAX_MIM_LP_ADDRESS, JoePair__factory.abi).connect(myWallet) as JoePair;
      this.tusContract = new ethers.Contract(TUS_CONTRACT_ADDRESS, TUSContract__factory.abi).connect(myWallet) as TUSContract;
      this.tusWavaxLPContract = new ethers.Contract(TUS_WAVAX_LP_ADDRESS, JoePair__factory.abi).connect(myWallet) as JoePair;
      this.craContract = new ethers.Contract(CRA_CONTRACT_ADDRESS, CRAContract__factory.abi).connect(myWallet) as CRAContract;
      this.craWavaxLPContract = new ethers.Contract(CRA_WAVAX_LP_ADDRESS, JoePair__factory.abi).connect(myWallet) as JoePair;
      this.crabWallet = myWallet;
  }

  async getCRABalance(mimPerWavax: number): Promise<TokenBalance> {
    const [craReserves, wavaxReservesForCRA] = await this.craWavaxLPContract.getReserves();
    
    const craPricePerWavax = craReserves.div(wavaxReservesForCRA).toNumber();
    const craPricePerMim = mimPerWavax / craPricePerWavax;

    const craBalance: BigNumber = await this.craContract.balanceOf(process.env.ADDRESS!);
    const formattedCRABalance = ethers.utils.formatEther(craBalance.toString())

    return {
      balance: Number(formattedCRABalance).toLocaleString(undefined, {minimumFractionDigits: 2,maximumFractionDigits: 2}),
      balanceInUSD: (craPricePerMim*parseFloat(formattedCRABalance)).toLocaleString(undefined, {minimumFractionDigits: 2,maximumFractionDigits: 2}),
      USDPerToken:  craPricePerMim.toFixed(3),
    }
  }

  async getTUSBalance(mimPerWavax: number): Promise<TokenBalance> {
    const [wavaxReservesForTUS, tusReserves] = await this.tusWavaxLPContract.getReserves();
    
    const tusPricePerWavax = tusReserves.div(wavaxReservesForTUS).toNumber();
    const tusPricePerMim = mimPerWavax / tusPricePerWavax;

    const TUSbalance: BigNumber = await this.tusContract.balanceOf(process.env.ADDRESS!);
    const formattedTUSBalance = ethers.utils.formatEther(TUSbalance.toString())

    return {
      balance: Number(formattedTUSBalance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      balanceInUSD: (tusPricePerMim*parseFloat(formattedTUSBalance)).toLocaleString(undefined, {minimumFractionDigits: 2,maximumFractionDigits: 2}),
      USDPerToken: tusPricePerMim.toFixed(3),
    }
  }

  async getAvaxBalance(mimPerWavax: number): Promise<TokenBalance> {
    const avaxBalance = await this.crabWallet.getBalance();
    const formattedAvax = ethers.utils.formatEther(avaxBalance);

    return {
      balance: Number(formattedAvax).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      balanceInUSD: (mimPerWavax*parseFloat(formattedAvax)).toLocaleString(undefined, {minimumFractionDigits: 2,maximumFractionDigits: 2}),
      USDPerToken: mimPerWavax.toFixed(3),
    }
  }

  async getStringBalance(): Promise<string> {
    console.log('Attempting to get balances')

    const [mimReserves, wavaxReservesForMim] = await this.wavaxMIMLPContract.getReserves();
    const mimPerWavax = mimReserves.div(wavaxReservesForMim).toNumber();

    const result = await Promise.all([
      this.getTUSBalance(mimPerWavax),
      this.getCRABalance(mimPerWavax), 
      this.getAvaxBalance(mimPerWavax)])

    const tusBalance = result[0];
    const craBalance = result[1];
    const avaxBalance = result[2];
    
    console.log('Successfully retrieved balances')
    return `Spot Prices\nTUS: $${tusBalance.USDPerToken}\nCRA: $${craBalance.USDPerToken}\nAvax: $${avaxBalance.USDPerToken}\n\nWallet Balance\n${tusBalance.balance} TUS | $${tusBalance.balanceInUSD}\n${craBalance.balance} CRA | $${craBalance.balanceInUSD}\n${avaxBalance.balance} Avax | $${avaxBalance.balanceInUSD}\n\n`
  }
}

export default CrabWallet;