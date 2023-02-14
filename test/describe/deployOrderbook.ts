import { describeOrderbookProps } from './orderbook';

export function describeDeployOrderbookFactory({
    fee,
    addressBookAddress,
    tradedTokenAddress,
    baseTokenAddress,
    contractSize,
    priceTick,
    hideContractSize,
    hidePriceTick,
}: {
    readonly fee: bigint;
    readonly addressBookAddress: string;
    readonly tradedTokenAddress: string;
    readonly baseTokenAddress: string;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideContractSize: boolean;
    readonly hidePriceTick: boolean;
}): string {
    return `deploy orderbook${describeOrderbookProps({
        fee,
        addressBookAddress,
        tradedTokenAddress,
        baseTokenAddress,
        contractSize,
        priceTick,
        hideContractSize,
        hidePriceTick,
    })}`;
}
