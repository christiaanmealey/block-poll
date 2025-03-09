import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Home() {
    const {user, isAuthenticated, token} = useAuth();
    const navigate = useNavigate();

    const API_KEY = 'your_api_key';
    const API_SECRET = 'your_api_secret';
    const MIN_PRICE = 30000;  // Buy when price is this low
    const MAX_PRICE = 35000;  // Sell when price reaches this
    const TRADE_AMOUNT = 0.01; // BTC amount
    const STOP_LOSS_PERCENT = 5; // Stop loss at 5% below buy price
    const TRAILING_STOP_PERCENT = 3; // Move stop-loss up by 3%

    let lastBuyPrice:any = null;
    let trailingStopPrice:any = null;

    useEffect(() => {
        if(!user || !token) {
            navigate('/login');
        } else {
            console.log(user, token);
        }
    }, [user, isAuthenticated, token]);

    useEffect(() => {
        const interval = setInterval(tradeBot, 60000);

        return () => clearInterval(interval);
    }, [])
    
    const getPrice = async(symbol: string) => {
        try {
            const response:any = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
            return parseFloat(response.data.price);
        } catch(err) {
            console.error('error fetching price', err);
        }
    }

    const placeOrder = async(side:string) => {
        try {
            const orderData = {
                symbol: 'BTCUSDT',
                side,
                type: 'MARKET',
                quantity: TRADE_AMOUNT
            };
            const response: any = await fetch('https://api.binance.com/api/v3/order', {
            method: 'POST',    
            headers: 
            {
                'Content-Type':'application/json',
                'X-MBX-APIKEY': API_KEY
            },
            body: JSON.stringify(orderData)
            });

            console.log(`${side} order placed:`, response.data);
            return response.data.fills[0].price; // Return executed price
        } catch(err) {

        }
    }

    const tradeBot = async() => {
        const price = await getPrice('BTCUSDT');
        console.log(`Current price = $${price}`);
        if(!price) {
            console.error('failed to fetch current price');
            return false; 
        }

        if(!lastBuyPrice && price <= MIN_PRICE) {
            console.log('buying btc');
            lastBuyPrice = await placeOrder('BUY');
            trailingStopPrice = lastBuyPrice - (lastBuyPrice * (STOP_LOSS_PERCENT / 100));
            console.log(`Bought at $${lastBuyPrice}, Stop-Loss set at $${trailingStopPrice}`);
        }

        if(lastBuyPrice) {
            // Update trailing stop-loss if price moves up
            let newStopPrice = price - (price * (TRAILING_STOP_PERCENT / 100));
            if(newStopPrice > trailingStopPrice) {
                trailingStopPrice = newStopPrice;
                console.log(`Updated trailing stop-loss to $${trailingStopPrice}`);
            }
        }

        // Sell if price hits max or stop loss
        if(price >= MAX_PRICE || price <= trailingStopPrice) {
            console.log('selling BTC');
            await placeOrder('SELL');
            lastBuyPrice = null;
            trailingStopPrice = null;
            console.log('trade cycle complete')
        }
    }

    return (
        <div></div>
    )
}

export default Home;