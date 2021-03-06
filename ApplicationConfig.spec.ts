import chai = require('chai');
import {ApplicationConfig} from './ApplicationConfig';

let should = chai.should();

describe('Application config package', () => {

    describe('#constructor', () => {

        afterEach(() => {
            (ApplicationConfig as any)._config = null;
            ApplicationConfig.configure({});
            process.env.NODE_ENV = 'development';
        });

        it('should return object', () => {
            let config = ApplicationConfig.config;
            should.exist(config);
        });

        it('should pass default options', () => {
            let config = ApplicationConfig.config;
            config.startupPath.should.equals(process.cwd());
        });

        it('should throw on wrong options', () => {
            (() => {
                ApplicationConfig.configure({
                    configName: 'konfig.js'
                });
                ApplicationConfig.config;
            }).should.throw();
        });

        it('should return correct config', () => {
            ApplicationConfig.configure({
                localConfigName: 'noop.js'
            });

            let config = ApplicationConfig.config;

            config.startupPath.should.be.equal(process.cwd());
            should.exist(config.db);
            should.exist(config.very.nested.config);

            config.db.user.should.equal('test');
            config.db.pass.should.equal('testPass');

            config.very.nested.config.variable.should.equal(true);
        });

        it('should merge config correctly with localconfig', () => {
            let config = ApplicationConfig.config;

            should.exist(config.db);
            should.exist(config.very.nested.config);

            config.db.user.should.equal('test');
            config.db.pass.should.equal('mergePass');

            config.very.nested.config.variable.should.equal(true);
            config.very.nested.config.variableTwo.should.equal(true);
        });

        it('should merge config correctly with environment configfile', () => {
            process.env.NODE_ENV = 'test';

            let config = ApplicationConfig.config;

            should.exist(config.forTestEnv);

            delete process.env.NODE_ENV;
        });

        it('should disable isStage and isDebug', () => {
            ApplicationConfig.configure({
                enableStateVariables: false
            });

            let config = ApplicationConfig.config;

            should.not.exist(config.isDebug);
        });

        it('should configure isDebug correctly', () => {
            let config = ApplicationConfig.config;

            config.nodeEnv.should.equal('development');
            config.isDebug.should.equal(true);
        });

        it('should configure isProduction correctly', () => {
            process.env.NODE_ENV = 'production';

            let config = ApplicationConfig.config;

            config.nodeEnv.should.equal('production');
            config.isDebug.should.equal(false);

            delete process.env.NODE_ENV;
        });

        describe('environmental variables', () => {
            before(() => {
                process.env.app_config_db_user = 'envUser';
                process.env.app_config_arrayType = 'string1|string2|string3';
                process.env.app_config_singleElementArray = 'string1|';
                process.env.app_config_emptyArray = '|';
                process.env.applicationConfig_custom_prefix = 'customPrefixTest';
                process.env['app_config_custom-delimiter'] = 'customDelimiterTest';
                process.env['appConfig_custom-delimiter'] = 'customPrefixDelimiterTest';
            });

            after(() => {
                delete process.env.app_config_db_user;
                delete process.env.app_config_arrayType;
                delete process.env.app_config_singleElementArray;
                delete process.env.app_config_emptyArray;
                delete process.env.applicationConfig_custom_prefix;
                delete process.env['app_config_custom-delimiter'];
                delete process.env['appConfig_custom-delimiter'];
            });

            it('should catch correct vars with custom prefix', () => {
                ApplicationConfig.configure({
                    environmentPrefix: 'applicationConfig_'
                });

                let config = ApplicationConfig.config;

                config.custom.prefix.should.equals('customPrefixTest');
            });

            it('should catch correct vars with custom env delimiter', () => {
                ApplicationConfig.configure({
                    environmentDelimiter: '-'
                });

                let config = ApplicationConfig.config;

                config.custom.delimiter.should.equals('customDelimiterTest');
            });

            it('should catch correct vars with custom env prefix and delimiter', () => {
                ApplicationConfig.configure({
                    environmentPrefix: 'appConfig_',
                    environmentDelimiter: '-'
                });

                let config = ApplicationConfig.config;

                config.custom.delimiter.should.equals('customPrefixDelimiterTest');
            });

            it('should merge config correctly with environment variables', () => {
                let config = ApplicationConfig.config;

                should.exist(config.db);
                should.exist(config.very.nested.config);

                config.db.user.should.equal('envUser');
                config.db.pass.should.equal('mergePass');

                config.very.nested.config.variable.should.equal(true);
                config.very.nested.config.variableTwo.should.equal(true);
            });

            it('should parse an array correctly', () => {
                let config = ApplicationConfig.config;

                should.exist(config.arrayType);

                config.arrayType
                    .should.be.an('array')
                    .and.deep.equals(['string1', 'string2', 'string3']);
            });

            it('should parse an empty array correctly', () => {
                let config = ApplicationConfig.config;

                should.exist(config.emptyArray);

                config.emptyArray
                    .should.be.an('array')
                    .and.have.lengthOf(0);
            });

            it('should parse a single element array correctly', () => {
                let config = ApplicationConfig.config;

                should.exist(config.singleElementArray);

                config.singleElementArray
                    .should.be.an('array')
                    .and.deep.equals(['string1']);
            });

            it('should create an additional property correctly', () => {
                process.env.app_config_additional = 'additionalProperty';
                let config = ApplicationConfig.config;

                should.exist(config.additional);

                config.additional.should.equals('additionalProperty');

                delete process.env.app_config_additional;
            });

            it('should create a nested additional property correctly', () => {
                process.env.app_config_additional_variable = 'additionalProperty';
                let config = ApplicationConfig.config;

                should.exist(config.additional);
                should.exist(config.additional.variable);

                config.additional.variable.should.be.equal('additionalProperty');

                delete process.env.app_config_additional_variable;
            });
        });

        describe('redirecting variables', () => {
            before(() => {
                process.env.TEST_ENV_VAR = 'setVariable';
            });

            after(() => {
                delete process.env.TEST_ENV_VAR;
            });

            it('should redirect the correct environment variables', () => {
                let config = ApplicationConfig.config;

                should.exist(config.special);
                should.exist(config.special.routes.redirect);

                config.special.routes.redirect.should.equal('setVariable');
            });

            it('should leave the not set variables as they are', () => {
                let config = ApplicationConfig.config;

                should.exist(config.special);
                should.exist(config.special.routes.redirectNot);

                config.special.routes.redirectNot.should.equal('TEST_ENV_VAR_NOT_SET');
            });
        });

        describe('require files', () => {

            it('should return error on absolute path', () => {
                let config = ApplicationConfig.config;

                config.abs.should.equal('ABSOLUTE_PATH_NOT_ALLOWED');
            });

            it('should return error on non existing file', () => {
                let config = ApplicationConfig.config;

                config.notfound.should.equal('FILE_NOT_FOUND: ./foobar.json');
            });

            it('should return error require error', () => {
                let config = ApplicationConfig.config;

                config.err.should.have.string('REQUIRE_ERROR');
            });

            it('should require correct file', () => {
                let config = ApplicationConfig.config;

                config.file.requiredFile.should.be.true;
            });

        });
    });

    describe('#reload', () => {
        after(() => {
            delete process.env.app_config_db_user;
        });

        it('should reload and merge config correctly', () => {
            let config = ApplicationConfig.config;

            config.db.user.should.equal('test');

            process.env.app_config_db_user = 'envUser';

            ApplicationConfig.reload();
            config = ApplicationConfig.config;

            config.db.user.should.equal('envUser');
        });

        it('should reload and merge isDebug correctly', () => {
            let config = ApplicationConfig.config;

            config.isDebug.should.equal(true);

            process.env.NODE_ENV = 'production';

            ApplicationConfig.reload();
            config = ApplicationConfig.config;

            config.isDebug.should.equal(false);
        });
    });
});
