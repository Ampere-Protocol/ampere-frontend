<p align="center">
  <img src="https://github.com/user-attachments/assets/e17138dc-ad9c-45ea-80ab-9b6d0e542e89" alt="ampere_logo" width="10%">
</p>

# Ampere Protocol
### One Liquidity Pool. Unlimited Tokens. Infinite Possibilities.

Ampere Protocol is a multi-token pool for stablecoins inspired by the concept of [Orbital AMMs](https://www.paradigm.xyz/2025/06/orbital). The project showcases that concept with 3 stablecoin pool.

## What are multi-token or orbital pools ?

A liquidity pool (LP) is usually composed of 2 tokens and uses a curve to determine prices. Ticks can be set while providing liquidity to make sure swaps are done in particular price boundaries.
Now, we take this 2D curve to 3 dimensions with 3 tokens. Now, the curve looks like 1/8 th of a sphere and the price is determined by a point on it. Price boundaries can be set as circles on the sphere surface and ticks can be taken as parts of the sphere.

This concept can be generalised and taken to N-dimensions for N tokens.

## What are the advantages of multi-token or orbital pools ?

Traditional LPs are compromised of 2 tokens and if we need to swap one token for another and the pool doesn't exist, multiple hops of different LPs are required.
Existence of seperate LPs for swaps also opens arbitrage opportunity for institutions and greater possibility of MEV.

But, with a multi-token pool, all tokens exist in a single pool and thus no hops are needed and there are lesser opportunity of MEV.
<img width="1580" height="547" alt="Hop_comparison" src="https://github.com/user-attachments/assets/836dceb9-a14b-4877-96b4-6533cc609755" />

Also, if there are N tokens, there can be $^NP_2$ possible cominations of LPs which can be cluttering. But you only need one pool when using multi-token pools.
<div style="display: flex; justify-content: space-around;">
  <img style="width: 48%; margin: 1%;" alt="normal_permutations" src="https://github.com/user-attachments/assets/c7c99df0-c799-4131-b716-4eaa99849bbb" />
  <img style="width: 48%; margin: 1%;" alt="ampere_permutations" src="https://github.com/user-attachments/assets/34584a98-15cb-4aed-be83-ad1a4b2891a3" />
</div>

## Why use SUI for building multi-token pools ?

With multi-token pools, all swaps are about to happen with one contract and everyone will interact with it, leading to a lot of transactions.
As each swap takes place, the prices are re-calculated for N-dimensions and thus for a sequential execution chain, it can become gas heavy and it will be easier for bots to target a single contract for MEV.

Thus, SUI gives parallel execution and under 1 second block time heavily reduces these possibilities making it perfect for such revolutionary DeFi projects.
