import Constants, { ExecutionEnvironment } from 'expo-constants';

export const removeTashkeel = (text: string) => {
    return text.replace(/[\u0617-\u061A\u064B-\u065F\u0670\u0671\u06D6-\u06DC\u06DE-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9]/g, '');
}

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;