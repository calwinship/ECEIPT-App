// import React from 'react';
// import { Text, Image, SafeAreaView } from 'react-native';

// const Home = () => {
//   return (
//     <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Text>Home hello hello</Text>
//       <Text>hello</Text>
//       <Image
//         source={{ uri: "https://www.generalblue.com/blank-receipt-template/p/t96yb76mk/f/basic-blank-receipt-template-in-word-md.png?v=bff33447bb358f37e6b5141e8cce4c4a" }}
//         style={{ width: 150, height: 200 }}
//       />
//     </SafeAreaView>
//   );
// };

// export default Home;

import React, { useState } from 'react';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { Text, View } from 'react-native';

const App = () => {
  const [receipts, setReceipts] = useState([]);
  
  const onQRRead = ({ type, data }) => {
    if (type === 256) { // Check if it's a QR code
      const receipt = JSON.parse(data);
      setReceipts(oldReceipts => [...oldReceipts, receipt]);
      FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}${receipt.store_name}.txt`, data);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Camera 
        style={{ flex: 1 }} 
        onBarCodeScanned={onQRRead}
      />

      <View>
        {receipts.map((receipt, i) => (
          <View key={i}>
            <Text>{receipt.store_name}</Text>
            {receipt.receipt_items.map((item, j) => (
              <Text key={j}>{item.product_name}: {item.price}</Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default App;