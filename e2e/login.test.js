describe('Login Screen Tests', () => {
    beforeAll(async () => {
      await device.launchApp();
    });
  
    it('should show login screen', async () => {
      await expect(element(by.text('Login'))).toBeVisible();
    });
  
    it('should type email and password', async () => {
      await element(by.placeholder('Email')).typeText('test@example.com');
      await element(by.placeholder('Password')).typeText('Password123\n'); // \n to dismiss keyboard
    });
  
    it('should show error for invalid credentials', async () => {
      await element(by.text('Login')).tap();
      await expect(element(by.text('Incorrect password. Try again.'))).toBeVisible();
    });
  
    it('should navigate to Home screen on successful login', async () => {
      await element(by.placeholder('Email')).clearText();
      await element(by.placeholder('Email')).typeText('correctuser@example.com');
      await element(by.placeholder('Password')).clearText();
      await element(by.placeholder('Password')).typeText('CorrectPassword1\n');
  
      await element(by.text('Login')).tap();
      await expect(element(by.text('Welcome to Home'))).toBeVisible();
    });
  });
  