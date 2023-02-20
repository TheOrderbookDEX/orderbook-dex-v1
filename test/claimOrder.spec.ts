import { DefaultOverrides } from '@frugalwizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { claimOrderScenarios } from './scenarios/claimOrder';
import { Order } from '../src/OrderbookV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

// TODO test overflows/underflows

describe('claimOrder', () => {
    for (const [ description, scenarios ] of Object.entries(claimOrderScenarios)) {
        describe(description, () => {
            for (const scenario of scenarios) {
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
                        it('should return the amount of contracts claimed', async (test) => {
                            const [ amountClaimed ] = await test.executeStatic();
                            expect(amountClaimed)
                                .to.be.equal(scenario.amountClaimed);
                        });

                        it('should return the fee collected', async (test) => {
                            const [ , fee ] = await test.executeStatic();
                            expect(fee)
                                .to.be.equal(scenario.collectedFee);
                        });

                        it(`should decrease ${scenario.givenToken} balance of contract accordingly`, async (test) => {
                            const { givenAmount, collectedFee } = scenario;
                            const { orderbook, [scenario.givenToken]: givenToken } = test;
                            const expected = await givenToken.balanceOf(orderbook) - (givenAmount - collectedFee);
                            await test.execute();
                            expect(await givenToken.balanceOf(orderbook))
                                .to.be.equal(expected);
                        });

                        it(`should increase ${scenario.givenToken} balance of sender accordingly`, async (test) => {
                            const { givenAmount, collectedFee } = scenario;
                            const { mainAccount, [scenario.givenToken]: givenToken } = test;
                            const expected = await givenToken.balanceOf(mainAccount) + (givenAmount - collectedFee);
                            await test.execute();
                            expect(await givenToken.balanceOf(mainAccount))
                                .to.be.equal(expected);
                        });

                        it(`should increase collected fees accordingly`, async (test) => {
                            const { givenToken, collectedFee } = scenario;
                            const { orderbook } = test;
                            let [ collectedTradedToken, collectedBaseToken ] = await orderbook.collectedFees();
                            switch (givenToken) {
                                case 'tradedToken':
                                    collectedTradedToken += collectedFee;
                                    break;
                                case 'baseToken':
                                    collectedBaseToken += collectedFee;
                                    break;
                            }
                            await test.execute();
                            expect(await orderbook.collectedFees())
                                .to.be.deep.equal([ collectedTradedToken, collectedBaseToken ]);
                        });

                        if (scenario.deletesOrder) {
                            it('should delete order', async (test) => {
                                const { orderType, price, orderId } = scenario;
                                const { orderbook } = test;
                                await test.execute();
                                expect(await orderbook.order(orderType, price, orderId))
                                    .to.be.deep.equal(new Order(0n, 0n, 0n, 0n, 0n, 0n));
                            });

                            if (scenario.prevOrderId) {
                                it('should update prev order\'s next order id', async (test) => {
                                    const { orderType, price, prevOrderId, nextOrderId } = scenario;
                                    const { orderbook } = test;
                                    await test.execute();
                                    expect((await orderbook.order(orderType, price, prevOrderId)).nextOrderId)
                                        .to.be.equal(nextOrderId);
                                });
                            }

                            if (scenario.nextOrderId) {
                                it('should update next order\'s prev order id', async (test) => {
                                    const { orderType, price, prevOrderId, nextOrderId } = scenario;
                                    const { orderbook } = test;
                                    await test.execute();
                                    expect((await orderbook.order(orderType, price, nextOrderId)).prevOrderId)
                                        .to.be.equal(prevOrderId);
                                });
                            }

                            if (scenario.updatesLastActualOrderId) {
                                it('should update last actual order id of price point', async (test) => {
                                    const { orderType, price, prevOrderId } = scenario;
                                    const { orderbook } = test;
                                    await test.execute();
                                    expect((await orderbook.pricePoint(orderType, price)).lastActualOrderId)
                                        .to.be.equal(prevOrderId);
                                });
                            }

                        } else {
                            it('should update claimed amount', async (test) => {
                                const { orderType, price, orderId, amountClaimed } = scenario;
                                const { orderbook } = test;
                                const expected = await orderbook.order(orderType, price, orderId);
                                expected.claimed += amountClaimed;
                                await test.execute();
                                expect(await orderbook.order(orderType, price, orderId))
                                    .to.be.deep.equal(expected);
                            });
                        }
                    }
                });
            }
        });
    }
});
