import { AddContextFunction, BaseTestContext, TestScenario, TestScenarioProperties } from '@frugal-wizard/contract-test-helper';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { formatValue, parseValue } from '@frugal-wizard/abi2ts-lib';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';

export interface DeployOrderbookContext extends BaseTestContext {
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    readonly tradedToken: ERC20Mock;
    readonly baseToken: ERC20Mock;
}

export interface DeployOrderbookScenarioProperties extends TestScenarioProperties<BaseTestContext> {
    readonly fee?: bigint;
    readonly addressBookAddress?: string;
    readonly tradedTokenAddress?: string;
    readonly baseTokenAddress?: string;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
}

export class DeployOrderbookScenario extends TestScenario<DeployOrderbookContext, OrderbookV1, string> {
    readonly fee: bigint;
    readonly addressBookAddress?: string;
    readonly tradedTokenAddress?: string;
    readonly baseTokenAddress?: string;
    readonly contractSize: bigint;
    readonly priceTick: bigint;

    constructor({
        fee = 0n,
        addressBookAddress,
        tradedTokenAddress,
        baseTokenAddress,
        contractSize = parseValue(10),
        priceTick = parseValue(1),
        ...rest
    }: DeployOrderbookScenarioProperties) {
        super(rest);
        this.fee = fee;
        this.addressBookAddress = addressBookAddress;
        this.tradedTokenAddress = tradedTokenAddress;
        this.baseTokenAddress = baseTokenAddress;
        this.contractSize = contractSize;
        this.priceTick = priceTick;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.fee) {
            addContext('fee', this.fee);
        }
        if (this.addressBookAddress) {
            addContext('address book address', this.addressBookAddress);
        }
        if (this.tradedTokenAddress) {
            addContext('traded token address', this.tradedTokenAddress);
        }
        if (this.baseTokenAddress) {
            addContext('base token address', this.baseTokenAddress);
        }
        addContext('contractSize', formatValue(this.contractSize));
        addContext('priceTick', formatValue(this.priceTick));
        super.addContext(addContext);
    }

    protected async _setup(): Promise<DeployOrderbookContext> {
        const ctx = await super._setup();
        const treasury = await OrderbookDEXTeamTreasuryMock.deploy(this.fee);
        const addressBook = this.addressBookAddress ?
            AddressBook.at(this.addressBookAddress) :
            await AddressBook.deploy();
        const tradedToken = this.tradedTokenAddress ?
            ERC20Mock.at(this.tradedTokenAddress) :
            await ERC20Mock.deploy('Traded Token', 'TRADED', 18);
        const baseToken = this.baseTokenAddress ?
            ERC20Mock.at(this.baseTokenAddress) :
            await ERC20Mock.deploy('Base Token', 'BASE', 18);
        return { ...ctx, treasury, addressBook, tradedToken, baseToken };
    }

    async setup() {
        return await this._setup();
    }

    async execute({ treasury, addressBook, tradedToken, baseToken }: DeployOrderbookContext) {
        const { contractSize, priceTick } = this;
        return await OrderbookV1.deploy(treasury, addressBook, tradedToken, baseToken, contractSize, priceTick);
    }

    async executeStatic({ treasury, addressBook, tradedToken, baseToken }: DeployOrderbookContext) {
        const { contractSize, priceTick } = this;
        return await OrderbookV1.callStatic.deploy(treasury, addressBook, tradedToken, baseToken, contractSize, priceTick);
    }
}
