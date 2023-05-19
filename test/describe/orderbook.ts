import { formatValue } from '@frugalwizard/abi2ts-lib';
import { DeployAddress } from '../utils/addresses';

export function describeOrderbookProps({
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
    readonly addressBookAddress?: string;
    readonly tradedTokenAddress?: string;
    readonly baseTokenAddress?: string;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideContractSize: boolean;
    readonly hidePriceTick: boolean;
}): string {
    const description = [];
    if (addressBookAddress !== undefined && addressBookAddress != DeployAddress) {
        description.push(`addressBook = ${addressBookAddress}`);
    }
    if (tradedTokenAddress !== undefined && tradedTokenAddress != DeployAddress) {
        description.push(`tradedToken = ${tradedTokenAddress}`);
    }
    if (baseTokenAddress !== undefined && baseTokenAddress != DeployAddress) {
        description.push(`baseToken = ${baseTokenAddress}`);
    }
    if (fee) {
        description.push(`fee = ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        description.push(`contract size = ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        description.push(`price tick = ${formatValue(priceTick)}`);
    }
    return description.length ? ` with ${ description.join(' and ') }` : '';
}
