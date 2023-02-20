import { describeSetupActions } from '@frugalwizard/contract-test-helper';
import { OrderbookAction } from '../action/orderbook';
import { describeOrderbookProps } from './orderbook';

export function describeClaimFeesAction(): string {
    return `claim fees`;
}

export function describeClaimFeesScenario({
    fee,
    contractSize,
    priceTick,
    hideContractSize,
    hidePriceTick,
    setupActions,
}: {
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideContractSize: boolean;
    readonly hidePriceTick: boolean;
    readonly setupActions: OrderbookAction[];
}): string {
    return `${describeClaimFeesAction()}${describeSetupActions(
        setupActions
    )}${describeOrderbookProps({
        fee,
        contractSize,
        priceTick,
        hideContractSize,
        hidePriceTick,
    })}`;
}
