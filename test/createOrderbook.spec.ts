import { DefaultOverrides } from '@frugalwizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { is } from '@frugalwizard/contract-test-helper';
import { createOrderbookScenarios } from './scenarios/createOrderbook';
import { OrderbookV1 } from '../src/OrderbookV1';
import { OrderbookCreated } from '../src/OrderbookFactoryV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('createOrderbook', () => {
    for (const scenario of createOrderbookScenarios) {
        scenario.describe(({ it }) => {
            if (scenario.expectedError) {
                it('should fail', async (test) => {
                    await expect(test.execute())
                        .to.be.rejected;
                });

                it(`should fail with ${scenario.expectedError.name}`, async (test) => {
                    await expect(test.executeStatic())
                        .to.be.rejected.and.eventually.be.deep.equal(scenario.expectedError);
                });

            } else {
                it('should increase total created orderbooks', async (test) => {
                    const { orderbookFactory } = test;
                    const prevValue = await orderbookFactory.totalCreated();
                    await test.execute();
                    expect(await orderbookFactory.totalCreated())
                        .to.be.equal(prevValue + 1n);
                });

                it('should store created orderbook at next available index', async (test) => {
                    const { orderbookFactory } = test;
                    const orderbook = await test.executeStatic();
                    await test.execute();
                    expect(await orderbookFactory.orderbook(await orderbookFactory.totalCreated() - 1n))
                        .to.be.equal(orderbook);
                });

                it('should add created orderbook to existing orderbooks array', async (test) => {
                    const { orderbookFactory } = test;
                    const prevArray = await orderbookFactory.orderbooks(0n, await orderbookFactory.totalCreated());
                    const orderbook = await test.executeStatic();
                    await test.execute();
                    expect(await orderbookFactory.orderbooks(0n, await orderbookFactory.totalCreated()))
                        .to.be.deep.equal([ ...prevArray, orderbook ]);
                });

                it('should create an orderbook with the provided address book contract', async (test) => {
                    const orderbook = OrderbookV1.at(await test.executeStatic());
                    await test.execute();
                    expect(await orderbook.addressBook())
                        .to.be.equal(test.addressBook.address);
                });

                it('should create an orderbook with the provided traded token', async (test) => {
                    const orderbook = OrderbookV1.at(await test.executeStatic());
                    await test.execute();
                    expect(await orderbook.tradedToken())
                        .to.be.equal(test.tradedToken.address);
                });

                it('should create an orderbook with the provided base token', async (test) => {
                    const orderbook = OrderbookV1.at(await test.executeStatic());
                    await test.execute();
                    expect(await orderbook.baseToken())
                        .to.be.equal(test.baseToken.address);
                });

                it('should create an orderbook with the provided contract size', async (test) => {
                    const orderbook = OrderbookV1.at(await test.executeStatic());
                    await test.execute();
                    expect(await orderbook.contractSize())
                        .to.be.equal(scenario.contractSize);
                });

                it('should create an orderbook with the provided price tick', async (test) => {
                    const orderbook = OrderbookV1.at(await test.executeStatic());
                    await test.execute();
                    expect(await orderbook.priceTick())
                        .to.be.equal(scenario.priceTick);
                });

                it('should create an orderbook with ask price at zero', async (test) => {
                    const orderbook = OrderbookV1.at(await test.executeStatic());
                    await test.execute();
                    expect(await orderbook.askPrice())
                        .to.be.equal(0n);
                });

                it('should create an orderbook with bid price at zero', async (test) => {
                    const orderbook = OrderbookV1.at(await test.executeStatic());
                    await test.execute();
                    expect(await orderbook.askPrice())
                        .to.be.equal(0n);
                });

                it('should emit OrderbookCreated', async (test) => {
                    const { tradedToken, baseToken } = test;
                    const { contractSize, priceTick } = scenario;
                    const orderbook = await test.executeStatic();
                    const { events } = await test.execute();
                    const orderCreatedEvents = events.filter(is(OrderbookCreated));
                    expect(orderCreatedEvents)
                        .to.have.length(1);
                    expect(orderCreatedEvents[0].orderbook)
                        .to.be.equal(orderbook);
                    expect(orderCreatedEvents[0].tradedToken)
                        .to.be.equal(tradedToken.address);
                    expect(orderCreatedEvents[0].baseToken)
                        .to.be.equal(baseToken.address);
                    expect(orderCreatedEvents[0].contractSize)
                        .to.be.equal(contractSize);
                    expect(orderCreatedEvents[0].priceTick)
                        .to.be.equal(priceTick);
                });
            }
        });
    }
});
