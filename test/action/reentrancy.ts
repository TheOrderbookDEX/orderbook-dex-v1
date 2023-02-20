import { EthereumSetupContext, SetupAction } from '@frugalwizard/contract-test-helper';
import { OrderbookContext } from '../scenario/orderbook';
import { ReentrancyContext } from '../scenario/reentrancy';
import { Orders } from '../state/Orders';

export type ReentrancyAction = SetupAction<EthereumSetupContext & OrderbookContext & ReentrancyContext> & {
    apply(orders: Orders): Orders;
    encode(): string;
};
