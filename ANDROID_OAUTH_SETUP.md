# Android OAuth Setup Guide - Google Sign-In

## 📱 Step 1: Get Your SHA-1 Certificate Fingerprint

You need TWO fingerprints - one for debug and one for production.

### Debug Keystore (for development)

```bash
# Windows
keytool -keystore %USERPROFILE%\.android\debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android

# macOS/Linux
keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android
```

Look for this in the output:
```
Certificate fingerprints:
         SHA1: 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:AA:BB:CC:DD
         SHA256: ...
```

**Copy the SHA1 value** - you'll need it for Google Cloud Console.

### Production Keystore (for release builds)

```bash
# Replace with your actual keystore path
keytool -keystore path/to/your-release.keystore -list -v

# Example:
keytool -keystore C:\Users\YourName\wihy-release.keystore -list -v
```

You'll be prompted for the keystore password. Then copy the SHA1 fingerprint.

---

## 🔧 Step 2: Create Android OAuth Client in Google Cloud Console

### Go to Google Cloud Console

1. Navigate to: https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Application type**: **Android**

### Fill in the Form

**Name:** `WIHY Android App`  
(This is just for your reference in the console)

**Package name:** `com.wihy.app`  
(This must match your `applicationId` in `app/build.gradle`)

**SHA-1 certificate fingerprint:** `[YOUR_DEBUG_SHA1_HERE]`  
(Paste the SHA1 from Step 1)

Click **CREATE**

### Create SECOND Client for Production

Repeat the process for your production keystore:

**Name:** `WIHY Android App - Production`  
**Package name:** `com.wihy.app`  
**SHA-1 certificate fingerprint:** `[YOUR_PRODUCTION_SHA1_HERE]`

Click **CREATE**

---

## 📋 Step 3: Get Your Web Client ID

Google Sign-In for Android **also needs** the Web OAuth Client ID:

1. In Google Cloud Console → Credentials
2. Find your **Web application** OAuth 2.0 Client ID
3. Copy the **Client ID** (it looks like: `12913076533-xxx.apps.googleusercontent.com`)

**Current Web Client ID:**
```
12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com
```

---

## 🔨 Step 4: Configure Android App

### Update `app/build.gradle`

Make sure your `applicationId` matches what you entered in Google Console:

```gradle
android {
    defaultConfig {
        applicationId "com.wihy.app"  // Must match Google Console
        // ... other config
    }
}
```

### Add Google Services JSON (if using Firebase)

If using Firebase/Google Services:

1. Download `google-services.json` from Firebase Console
2. Place it in `app/google-services.json`
3. Add to `app/build.gradle`:

```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'
    id 'com.google.gms.google-services'  // Add this
}
```

### Add Dependencies

```gradle
dependencies {
    // Google Sign-In
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
    
    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
}
```

### Create `res/values/strings.xml` Entry

```xml
<resources>
    <string name="app_name">WIHY</string>
    
    <!-- Google OAuth Web Client ID -->
    <string name="google_web_client_id">12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com</string>
</resources>
```

---

## 💻 Step 5: Implement Google Sign-In

### Create GoogleSignInHelper.kt

```kotlin
// ui/auth/GoogleSignInHelper.kt
package com.wihy.app.ui.auth

import android.app.Activity
import android.content.Intent
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import com.wihy.app.R

class GoogleSignInHelper(private val activity: Activity) {
    
    companion object {
        const val RC_GOOGLE_SIGN_IN = 9001
    }
    
    private val googleSignInClient: GoogleSignInClient
    
    init {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(activity.getString(R.string.google_web_client_id))
            .requestEmail()
            .requestProfile()
            .build()
        
        googleSignInClient = GoogleSignIn.getClient(activity, gso)
    }
    
    fun signIn() {
        val signInIntent = googleSignInClient.signInIntent
        activity.startActivityForResult(signInIntent, RC_GOOGLE_SIGN_IN)
    }
    
    fun handleSignInResult(data: Intent?, callback: (GoogleSignInAccount?, Exception?) -> Unit) {
        val task: Task<GoogleSignInAccount> = GoogleSignIn.getSignedInAccountFromIntent(data)
        try {
            val account = task.getResult(ApiException::class.java)
            callback(account, null)
        } catch (e: ApiException) {
            callback(null, e)
        }
    }
    
    fun signOut(callback: () -> Unit) {
        googleSignInClient.signOut().addOnCompleteListener {
            callback()
        }
    }
    
    fun getLastSignedInAccount(): GoogleSignInAccount? {
        return GoogleSignIn.getLastSignedInAccount(activity)
    }
}
```

### Update LoginActivity.kt

```kotlin
// ui/auth/LoginActivity.kt
package com.wihy.app.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.wihy.app.R
import com.wihy.app.data.repository.AuthRepository
import com.wihy.app.databinding.ActivityLoginBinding
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var authRepository: AuthRepository
    private lateinit var googleSignInHelper: GoogleSignInHelper
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        authRepository = AuthRepository(this)
        googleSignInHelper = GoogleSignInHelper(this)
        
        setupListeners()
        checkExistingSignIn()
    }
    
    private fun setupListeners() {
        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString()
            val password = binding.etPassword.text.toString()
            
            if (email.isBlank() || password.isBlank()) {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            login(email, password)
        }
        
        binding.btnGoogleSignIn.setOnClickListener {
            googleSignInHelper.signIn()
        }
        
        binding.tvRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }
    
    private fun checkExistingSignIn() {
        // Check if user already signed in with Google
        val account = googleSignInHelper.getLastSignedInAccount()
        if (account != null) {
            // User is already signed in, send token to backend
            handleGoogleSignIn(account.idToken!!)
        }
    }
    
    private fun login(email: String, password: String) {
        binding.btnLogin.isEnabled = false
        
        lifecycleScope.launch {
            authRepository.login(email, password)
                .onSuccess { user ->
                    Toast.makeText(
                        this@LoginActivity,
                        "Welcome ${user.name}!",
                        Toast.LENGTH_SHORT
                    ).show()
                    navigateToMain()
                }
                .onFailure { error ->
                    Toast.makeText(
                        this@LoginActivity,
                        error.message ?: "Login failed",
                        Toast.LENGTH_SHORT
                    ).show()
                    binding.btnLogin.isEnabled = true
                }
        }
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == GoogleSignInHelper.RC_GOOGLE_SIGN_IN) {
            googleSignInHelper.handleSignInResult(data) { account, error ->
                if (error != null) {
                    Toast.makeText(
                        this,
                        "Google sign-in failed: ${error.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                    return@handleSignInResult
                }
                
                if (account?.idToken != null) {
                    handleGoogleSignIn(account.idToken!!)
                } else {
                    Toast.makeText(
                        this,
                        "Failed to get Google ID token",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    private fun handleGoogleSignIn(idToken: String) {
        lifecycleScope.launch {
            try {
                // Send ID token to your backend
                val response = authRepository.loginWithGoogle(idToken)
                response.onSuccess { user ->
                    Toast.makeText(
                        this@LoginActivity,
                        "Welcome ${user.name}!",
                        Toast.LENGTH_SHORT
                    ).show()
                    navigateToMain()
                }
                response.onFailure { error ->
                    Toast.makeText(
                        this@LoginActivity,
                        "Login failed: ${error.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@LoginActivity,
                    "Error: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
    
    private fun navigateToMain() {
        // Navigate to main activity
        finish()
    }
}
```

### Add Google Login to AuthRepository.kt

```kotlin
// data/repository/AuthRepository.kt
suspend fun loginWithGoogle(idToken: String): Result<User> = withContext(Dispatchers.IO) {
    try {
        val response = RetrofitClient.authApi.loginWithGoogle(idToken)
        
        if (response.isSuccessful && response.body()?.success == true) {
            val data = response.body()!!.data!!
            saveToken(data.token)
            RetrofitClient.setAuthToken(data.token)
            Result.success(data.user)
        } else {
            val error = response.body()?.error ?: "Google login failed"
            Result.failure(Exception(error))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

### Update AuthApiService.kt

```kotlin
// data/api/AuthApiService.kt
interface AuthApiService {
    @POST("/api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @POST("/api/auth/google")
    suspend fun loginWithGoogle(@Body idToken: String): Response<AuthResponse>
    
    @POST("/api/auth/logout")
    suspend fun logout(): Response<AuthResponse>
    
    @GET("/api/auth/session")
    suspend fun getSession(): Response<AuthResponse>
}
```

---

## 🧪 Step 6: Test Google Sign-In

### Test on Debug Build

1. Build and install debug APK:
   ```bash
   ./gradlew installDebug
   ```

2. Launch app and tap "Sign in with Google"

3. You should see:
   - Google account picker
   - Permission consent screen
   - Redirect back to app with successful login

### Common Issues

#### "Error 10: Developer Error"
**Cause:** SHA-1 fingerprint doesn't match or package name is wrong

**Solution:**
1. Verify SHA-1: `keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android`
2. Check package name matches `applicationId` in `app/build.gradle`
3. Wait 5-10 minutes after creating OAuth client (Google caches configs)

#### "Sign in failed: 12501"
**Cause:** User cancelled sign-in or OAuth client not configured

**Solution:**
1. Verify Web Client ID in `strings.xml`
2. Check both Android and Web OAuth clients exist in Google Console

#### "API not enabled"
**Cause:** Google Sign-In API not enabled in Google Cloud

**Solution:**
1. Go to https://console.cloud.google.com/apis/library
2. Search for "Google Sign-In API"
3. Click **ENABLE**

---

## 📋 Summary Checklist

- [ ] Get SHA-1 fingerprint (debug)
- [ ] Get SHA-1 fingerprint (production)
- [ ] Create Android OAuth client in Google Console
- [ ] Copy Web Client ID to `strings.xml`
- [ ] Update `applicationId` in `build.gradle`
- [ ] Add Google Sign-In dependency
- [ ] Implement `GoogleSignInHelper.kt`
- [ ] Update `LoginActivity.kt`
- [ ] Add backend API endpoint
- [ ] Test sign-in flow
- [ ] Verify token sent to backend

---

## 🔐 Your OAuth Credentials

**Package Name:** `com.wihy.app`

**Web Client ID:** `12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com`

**Android Client ID:** (Created after you submit the form)

**Debug SHA-1:** (Get with keytool command above)

**Production SHA-1:** (Get from your release keystore)

---

## 📞 Support

If you encounter issues:
1. Check Google Cloud Console logs
2. Verify all OAuth clients are created
3. Ensure redirect URIs match exactly
4. Wait 5-10 minutes for Google cache refresh
5. Check logcat for error messages: `adb logcat | grep GoogleSignIn`
