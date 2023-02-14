import { formatValue } from '@frugal-wizard/abi2ts-lib';
import { describeSetupActions } from '@frugal-wizard/contract-test-helper';
import { OrderbookFactoryAction } from '../action/factory';
import { DeployAddress } from '../utils/addresses';

export function describeCreateOrderbookAction({
    contractSize,
    priceTick,
    hideContractSize,
    hidePriceTick,
}: {
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideContractSize: boolean;
    readonly hidePriceTick: boolean;
}): string {
    const description = ['create orderbook'];
    const settings = [];
    if (!hideContractSize) {
        settings.push(`contract size = ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick = ${formatValue(priceTick)}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
}

export function describeCreateOrderbookScenario({
    fee,
    tradedTokenAddress,
    baseTokenAddress,
    contractSize,
    priceTick,
    hideContractSize,
    hidePriceTick,
    setupActions,
}: {
    readonly fee: bigint;
    readonly tradedTokenAddress: string;
    readonly baseTokenAddress: string;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideContractSize: boolean;
    readonly hidePriceTick: boolean;
    readonly setupActions: OrderbookFactoryAction[];
}): string {
    const description = ['create orderbook'];
    const settings = [];
    if (fee) {
        settings.push(`fee = ${fee}`);
    }
    if (tradedTokenAddress != DeployAddress) {
        settings.push(`tradedToken = ${tradedTokenAddress}`);
    }
    if (baseTokenAddress != DeployAddress) {
        settings.push(`baseToken = ${baseTokenAddress}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size = ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick = ${formatValue(priceTick)}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return `${description.join(' ')}${describeSetupActions(
        setupActions
    )}`;
}
