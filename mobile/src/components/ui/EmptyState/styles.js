import styled from 'styled-components/native';
import { fonts } from '../../../styles/fonts';

export const Container = styled.View`
  flex: 1;
  padding: 24px;
  justify-content: center;
  align-items: center;
`;

export const IconWrapper = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  width: 80px;
  height: 80px;
  border-radius: 40px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

export const Title = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
  text-align: center;
`;

export const Text = styled.Text`
  color: ${(props) => props.theme.textSecondary};
  font-size: 14px;
  line-height: 21px;
  text-align: center;
`;

export const ActionWrapper = styled.View`
  margin-top: 20px;
`;
