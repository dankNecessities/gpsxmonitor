import React, {useEffect, useState} from 'react';
import {StatusBar, ToastAndroid} from 'react-native';
import styled from 'styled-components/native';
import Input from '../components/inputs/input';
import GenericButton from '../components/buttons/genericButton';
import API from '../api/api';

export default function LoginScreen({navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goToScreen = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <Container>
      <StatusBar backgroundColor="#4788c7" />
      <ImageContainer
        source={require('../assets/icon.png')}
        resizeMode="contain"
      />
      <FormContainer>
        <Input
          placeholder="Email"
          width={300}
          color="#c5c5c5"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
          }}
        />
        <Input
          placeholder="Password"
          width={300}
          hidden={true}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
          }}
        />
        <RowContainer width={300}>
          <Button onPress={() => goToScreen('Reset')}>
            <Text color="#c5c5c5" margin={5}>
              Forgot Password?
            </Text>
          </Button>
        </RowContainer>
        <GenericButton
          title="Log in"
          onPress={() => {
            API.authenticateUser(email, password).then((result) => {
              if (result === true) {
                goToScreen('Dashboard');
              } else {
                ToastAndroid.show(
                  result,
                  ToastAndroid.SHORT,
                  ToastAndroid.CENTER,
                );
              }
            });
          }}
          color="#ffffff"
          bgcolor="#4788c7"
          width={300}
        />
        <Button onPress={() => goToScreen('Dashboard')}>
          <Text padding={10} margin={10} size={18}>
            Demo
          </Text>
        </Button>
      </FormContainer>
    </Container>
  );
}

const Container = styled.View`
  flex-direction: column;
  background-color: #ffffff;
  align-items: center;
  justify-content: space-evenly;
  height: 100%;
  width: 100%;
`;

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  width: ${(props) => props.width || 'auto'};
`;

const ImageContainer = styled.Image`
  width: 180px;
  height: 180px;
  margin: 5px;
`;

const FormContainer = styled.View`
  flex-direction: column;
  background-color: transparent;
  align-items: center;
  justify-content: center;
`;

const Button = styled.TouchableOpacity``;

const Text = styled.Text`
  font-size: ${(props) => props.size || 16}px;
  color: ${(props) => props.color || '#4788c7'};
  font-family: 'Roboto-Regular';
  padding: ${(props) => props.padding || 0}px;
  margin: ${(props) => props.margin || 0}px;
`;
