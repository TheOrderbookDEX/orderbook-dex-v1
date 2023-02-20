import { describeSetupActions } from '@frugalwizard/contract-test-helper';
import { OrderbookAction } from '../action/orderbook';
import { ReentrancyAction } from '../action/reentrancy';
import { describeOrderbookProps } from './orderbook';

export function describeReentrancyScenario({
    compromisedToken,
    mainAction,
    reentrantAction,
    fee,
    contractSize,
    priceTick,
    hideContractSize,
    hidePriceTick,
    setupActions,
}: {
    readonly compromisedToken: string;
    readonly mainAction: ReentrancyAction;
    readonly reentrantAction: ReentrancyAction;
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideContractSize: boolean;
    readonly hidePriceTick: boolean;
    readonly setupActions: (OrderbookAction | ReentrancyAction)[];
}) {
    const description = ['test reentrancy of'];
    description.push(reentrantAction.description);
    description.push('before transfer of');
    description.push(compromisedToken);
    description.push('in');
    description.push(mainAction.description);
    return `${description.join(' ')}${describeSetupActions(
        setupActions
    )}${describeOrderbookProps({
        fee,
        contractSize,
        priceTick,
        hideContractSize,
        hidePriceTick,
    })}`;
}
