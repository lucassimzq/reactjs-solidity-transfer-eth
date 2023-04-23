import React, { useEffect, useState } from "react";
import { ethers, toBeHex } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

// Fetch contract object
const getEthereumContract = async () => {
	const provider = new ethers.BrowserProvider(ethereum);
	const signer = await provider.getSigner();
	const transactionContract = new ethers.Contract(
		contractAddress,
		contractABI,
		signer
	);

	let count = await transactionContract.getAllTransactions();

	return transactionContract;
};

export const TransactionProvider = ({ children }) => {
	const [currentAccount, setCurrentAccount] = useState("");
	const [formData, setFormData] = useState({
		addressTo: "",
		amount: "",
		keyword: "",
		message: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [transactionCount, setTransactionCount] = useState(
		localStorage.getItem("transactionCount")
	);
	const [transactions, setTransactions] = useState([]);

	const handleChange = (e, name) => {
		setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
	};

	const getAllTransactions = async () => {
		try {
			if (!ethereum) return alert("Please install metamask");

			const transactionContract = await getEthereumContract();
			const availableTransaction =
				await transactionContract.getAllTransactions();

			const structuredTransactions = availableTransaction.map((transaction) => {
				return {
					addressTo: transaction.receiver,
					addressFrom: transaction.sender,
					timestamp: new Date(
						ethers.toNumber(transaction.timestamp) * 1000
					).toLocaleString(),
					message: transaction.message,
					keyword: transaction.keyword,
					amount: ethers.formatEther(transaction.amount),
				};
			});

			setTransactions(structuredTransactions);
		} catch (error) {
			console.log(error);
		}
	};

	const checkIfWalletIsConnected = async () => {
		try {
			if (!ethereum) return alert("Please install metamask");

			const accounts = await ethereum.request({ method: "eth_accounts" });

			if (accounts.length) {
				setCurrentAccount(accounts[0]);

				getAllTransactions();
			} else {
				console.log("No account found");
			}
		} catch (error) {
			console.log(error);

			throw new Error("No ethereum object.");
		}
	};

	const checkIfTransactionsExists = async () => {
		try {
			const transactionContract = await getEthereumContract();
			const transactionCount = await transactionContract.getTransactionCount();

			window.localStorage.setItem("transactionCount", transactionCount);
		} catch (error) {
			console.log(error);

			throw new Error("No ethereum object");
		}
	};

	const connectWallet = async () => {
		try {
			if (!ethereum) return alert("Please install metamask");

			const accounts = await ethereum.request({
				method: "eth_requestAccounts",
			});

			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);

			throw new Error("No ethereum object.");
		}
	};

	const sendTransaction = async () => {
		try {
			if (!ethereum) return alert("Please install metamask");

			// get data from the form
			const { addressTo, amount, keyword, message } = formData;

			const transactionContract = await getEthereumContract();
			const parsedAmount = toBeHex(ethers.parseEther(amount));

			console.log(transactionContract);
			await ethereum.request({
				method: "eth_sendTransaction",
				params: [
					{
						from: currentAccount,
						to: addressTo,
						gas: "0x5208", // 21000 GWEI
						value: parsedAmount, // 0.0001
					},
				],
			});

			const transactionHash = await transactionContract.addToBlockchain(
				addressTo,
				ethers.parseEther(amount),
				message,
				keyword
			);

			setIsLoading(true);

			console.log(`Loading - ${transactionHash.hash}`);
			await transactionHash.wait();

			setIsLoading(false);
			console.log(`Success - ${transactionHash.hash}`);

			const transactionCount = await transactionContract.getTransactionCount();

			setTransactionCount(transactionCount);
		} catch (error) {
			console.log(error);

			throw new Error("No ethereum object.");
		}
	};

	useEffect(() => {
		checkIfWalletIsConnected();
		checkIfTransactionsExists();
	}, []);

	return (
		<TransactionContext.Provider
			value={{
				connectWallet,
				currentAccount,
				formData,
				handleChange,
				sendTransaction,
				transactions,
				isLoading,
			}}
		>
			{children}
		</TransactionContext.Provider>
	);
};
