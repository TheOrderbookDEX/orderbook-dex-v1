import { ContractError, formatValue, parseValue } from 'abi2ts-lib';
import { AddContextFunction } from 'contract-test-helper';
import { IOperator } from 'orderbook-dex-operator/dist/interfaces/IOperator';
import { Operator } from 'orderbook-dex-operator/dist/Operator';
import { OperatorLogicRegistry } from 'orderbook-dex-operator/dist/OperatorLogicRegistry';
import { OperatorLogicV1 } from '../../src/OperatorLogicV1';
import { OrderbookContext, OrderbookScenario, OrderbookScenarioProperties } from './OrderbookScenario';

export interface OperatorContext extends OrderbookContext {
    readonly operatorLogic: OperatorLogicV1;
    readonly logicRegistry: OperatorLogicRegistry;
    readonly operator: IOperator;
}

export interface OperatorScenarioProperties extends OrderbookScenarioProperties<OperatorContext> {
    readonly expectedErrorInResult?: ContractError;
    readonly tradedTokenBalance?: bigint;
    readonly baseTokenBalance?: bigint;
}

export abstract class OperatorScenario<ExecuteResult, ExecuteStaticResult>
    extends OrderbookScenario<OperatorContext, ExecuteResult, ExecuteStaticResult>
{
    readonly expectedErrorInResult?: ContractError;
    readonly tradedTokenBalance: bigint;
    readonly baseTokenBalance: bigint;

    constructor({
        expectedErrorInResult,
        tradedTokenBalance = parseValue(1000000),
        baseTokenBalance = parseValue(1000000),
        ...rest
    }: OperatorScenarioProperties) {
        super(rest);
        this.expectedErrorInResult = expectedErrorInResult;
        this.tradedTokenBalance = tradedTokenBalance;
        this.baseTokenBalance = baseTokenBalance;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.expectedErrorInResult) {
            addContext('expectedErrorInResult', this.expectedErrorInResult.message);
        }
        if (this.tradedTokenBalance != parseValue(1000000)) {
            addContext('tradedTokenBalance', formatValue(this.tradedTokenBalance));
        }
        if (this.baseTokenBalance != parseValue(1000000)) {
            addContext('baseTokenBalance', formatValue(this.baseTokenBalance));
        }
        super.addContext(addContext);
    }

    protected async _setup(): Promise<OperatorContext> {
        const ctx = await super._setup();
        const { mainAccount, addressBook, tradedToken, baseToken } = ctx;
        const operatorLogic = await OperatorLogicV1.deploy();
        const logicRegistry = await OperatorLogicRegistry.deploy();
        await logicRegistry.register(10000n, operatorLogic);
        const operator = IOperator.at((await Operator.deploy(mainAccount, logicRegistry, addressBook)).address);
        await tradedToken.give(operator, this.tradedTokenBalance);
        await baseToken.give(operator, this.baseTokenBalance);
        return { ...ctx, operatorLogic, logicRegistry, operator };
    }

    async setup() {
        return await this._setup();
    }
}
