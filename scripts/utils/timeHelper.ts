import { ethers } from "hardhat";

function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getCurrentTime(): string {
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date+'|'+time;
}

const apiTimeout = async (promise: Promise<any>, time: number = 60000) => {
    return Promise.race([
        promise,
        new Promise((_r, rej) => setTimeout(() => rej("Retrying - transaction took too long."), time)),
     ])
     .then(result => result);
}

const getBlockTimestamp= async (): Promise<number> => {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  return blockBefore.timestamp;
}

export default {
  getBlockTimestamp,
  apiTimeout,
  getCurrentTime,
  sleep
}
