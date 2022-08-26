import Head from "next/head";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";
import { NextPage } from "next";


const Homepage: NextPage = () => {
  const [walletConnected, setWalletConnected] = useState<boolean>(false)
  const [joinedWhitelist, setJoinedWhitelist] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState<number>(0)

  const web3ModalRef = useRef<any>()

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork()
    if (chainId !== 4) {
      window.alert('Change the network to Rinkeby')
      throw new Error('Change network to Rinkeby')
    }

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  const addAddressToWhitelist = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true)
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer,
      )
      // call the addAddressToWhitelist from the contract
      const tx = await whitelistContract.addAddressToWhitelist()
      setLoading(true)
      // wait for the transaction to get mined
      await tx.wait()
      setLoading(false)
      // get the updated number of addresses in the whitelist
      await getNumberOfWhitelisted()
      setJoinedWhitelist(true)
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * getNumberOfWhitelisted:  gets the number of whitelisted addresses
   */
  const getNumberOfWhitelisted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner()
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider,
      )
      // call the numAddressesWhitelisted from the contract
      const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted()
      setNumberOfWhitelisted(_numberOfWhitelisted)
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * checkIfAddressInWhitelist: Checks if the address is in whitelist
   */
  const checkIfAddressInWhitelist = async () => {
    try {
      // We will need the signer later to get the user's address
      // Even though it is a read transaction, since Signers are just special kinds of Providers,
      // We can use it in it's place
      const signer = await getProviderOrSigner(true)
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer,
      )
      // Get the address associated to the signer which is connected to  MetaMask
      // @ts-ignore
      const address = await signer.getAddress()
      // call the whitelistedAddresses from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address,
      )
      setJoinedWhitelist(_joinedWhitelist)
    } catch (err) {
      console.error(err)
    }
  }

  /*
    connectWallet: Connects the MetaMask wallet
  */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner()
      setWalletConnected(true)

      checkIfAddressInWhitelist()
      getNumberOfWhitelisted()
    } catch (err) {
      console.error(err)
    }
  }

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className="px-4 py-1 rounded-md bg-emerald-200 text-emerald-600 font-text">
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loading) {
        return <button className='px-4 py-1 rounded-md font-text bg-stone-200 text-stone-600'>Loading...</button>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className="px-4 py-1 text-blue-600 bg-blue-200 font-text">
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className="px-4 py-1 text-yellow-600 bg-yellow-200 rounded-md font-text">
          Connect your wallet
        </button>
      );
    }
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      // @ts-ignore
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
      </Head>

      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col gap-4 text-center">
          <h1 className="text-3xl font-bold font-title">Welcome to Crypto Devs!</h1>
          <div className="text-xl font-light font-text">
            Its an NFT collection for developers in Crypto.
          </div>
          <div className="font-text">
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        
      </div>

      <footer className="h-[20vh] bg-slate-800 text-white flex justify-center items-center font-text">
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
    
  )
}

export default Homepage
