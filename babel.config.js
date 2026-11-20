module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        allowUndefined: false,
        allowlist: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
        safe: false,
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
