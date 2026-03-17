import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

const String registerUrl = 'https://ecoloop-psi.vercel.app/api/user/register';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _houseNumberController = TextEditingController();
  final _wardController = TextEditingController();

  bool _isSubmitting = false;
  bool _isPasswordVisible = false;
  String? _errorMsg;
  File? _profilePictureFile;

  final ImagePicker _picker = ImagePicker();

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _houseNumberController.dispose();
    _wardController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _pickProfilePicture() async {
    final XFile? picked =
        await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null) {
      setState(() => _profilePictureFile = File(picked.path));
    }
  }

  bool _validateLocal() {
    final nameRegex = RegExp(r'^[A-Za-z\s]+$');
    final emailRegex = RegExp(
        r'^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$');
    final passwordRegex = RegExp(r'^.{6,8}$');

    if (!nameRegex.hasMatch(_nameController.text.trim())) {
      _showAlert('Name should contain only letters and spaces.');
      return false;
    }
    if (!emailRegex.hasMatch(_emailController.text.trim())) {
      _showAlert('Please provide a valid email (gmail, yahoo, outlook).');
      return false;
    }
    if (!passwordRegex.hasMatch(_passwordController.text)) {
      _showAlert('Password must be 6 to 8 characters long.');
      return false;
    }
    if (_houseNumberController.text.trim().isEmpty ||
        _wardController.text.trim().isEmpty) {
      _showAlert('Please fill all required fields, including House Number and Ward.');
      return false;
    }
    return true;
  }

  void _showAlert(String message) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Text(message, style: GoogleFonts.poppins()),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('OK', style: GoogleFonts.poppins(color: const Color(0xFF059669))),
          ),
        ],
      ),
    );
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_validateLocal()) return;

    setState(() {
      _isSubmitting = true;
      _errorMsg = null;
    });

    final request = http.MultipartRequest('POST', Uri.parse(registerUrl));
    request.fields['name'] = _nameController.text.trim();
    request.fields['username'] = _usernameController.text.trim();
    request.fields['email'] = _emailController.text.trim();
    request.fields['password'] = _passwordController.text;
    request.fields['phone'] = _phoneController.text.trim();
    request.fields['address'] = _addressController.text.trim();
    request.fields['houseNumber'] = _houseNumberController.text.trim();
    request.fields['wardNumber'] = _wardController.text.trim();

    if (_profilePictureFile != null) {
      request.files.add(
        await http.MultipartFile.fromPath('profilePicture', _profilePictureFile!.path),
      );
    }

    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final Map<String, dynamic> data =
          jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final username = (data['username'] ?? _usernameController.text).toString();
        if (!mounted) return;
        _showAlert('Registration successful! Your username is: $username');
        _formKey.currentState!.reset();
        for (final c in [
          _nameController, _usernameController, _emailController,
          _passwordController, _phoneController, _addressController,
          _houseNumberController, _wardController,
        ]) {
          c.clear();
        }
        setState(() => _profilePictureFile = null);
      } else {
        setState(() {
          _errorMsg = data['message']?.toString() ?? 'Registration failed';
        });
      }
    } catch (e) {
      setState(() => _errorMsg = 'Error connecting to server. Please try again.');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background gradient matching login page
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0D3B31),
                  Color(0xFF10B981),
                  Color(0xFF0EA5E9),
                ],
              ),
            ),
          ),

          // Decorative circles
          Positioned(
            top: -100,
            right: -50,
            child: _decorativeCircle(250, Colors.white.withOpacity(0.1)),
          ),
          Positioned(
            bottom: -50,
            left: -80,
            child: _decorativeCircle(300, Colors.white.withOpacity(0.05)),
          ),

          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                  child: Column(
                    children: [
                      // Logo
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withOpacity(0.3)),
                        ),
                        child: Image.asset(
                          'assets/images/app_icon.png',
                          height: 50,
                          width: 50,
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'EcoLoop',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2,
                        ),
                      ),
                      Text(
                        'Create your account',
                        style: GoogleFonts.poppins(
                          color: Colors.white70,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Glassmorphic form card
                      ClipRRect(
                        borderRadius: BorderRadius.circular(30),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                          child: Container(
                            padding: const EdgeInsets.all(28),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(30),
                              border: Border.all(color: Colors.white.withOpacity(0.2)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 20,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                            child: Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  _sectionLabel('Personal Info'),
                                  const SizedBox(height: 12),
                                  _buildField(_nameController, 'Full Name', Icons.person_outline),
                                  const SizedBox(height: 14),
                                  _buildField(_usernameController, 'Username', Icons.alternate_email),
                                  const SizedBox(height: 14),
                                  _buildField(_emailController, 'Email', Icons.email_outlined,
                                      keyboardType: TextInputType.emailAddress),
                                  const SizedBox(height: 14),
                                  _buildField(_passwordController, 'Password (6–8 chars)',
                                      Icons.lock_outline, isPassword: true),
                                  const SizedBox(height: 14),
                                  _buildField(_phoneController, 'Phone Number',
                                      Icons.phone_outlined,
                                      keyboardType: TextInputType.phone),
                                  const SizedBox(height: 24),

                                  _sectionLabel('Address Details'),
                                  const SizedBox(height: 12),
                                  _buildField(_addressController, 'Address', Icons.home_outlined),
                                  const SizedBox(height: 14),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildField(_houseNumberController,
                                            'House No.', Icons.door_front_door_outlined),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _buildField(
                                            _wardController, 'Ward', Icons.location_city_outlined),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 24),

                                  _sectionLabel('Profile Picture (Optional)'),
                                  const SizedBox(height: 12),
                                  _buildImagePicker(),
                                  const SizedBox(height: 24),

                                  if (_errorMsg != null) ...[
                                    Text(
                                      _errorMsg!,
                                      style: GoogleFonts.poppins(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                    const SizedBox(height: 16),
                                  ],

                                  _buildRegisterButton(),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),
                      TextButton(
                        onPressed: () =>
                            Navigator.of(context).pushReplacementNamed('/login'),
                        child: RichText(
                          text: TextSpan(
                            text: 'Already have an account? ',
                            style: GoogleFonts.poppins(color: Colors.white70),
                            children: [
                              TextSpan(
                                text: 'Login',
                                style: GoogleFonts.poppins(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _decorativeCircle(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }

  Widget _sectionLabel(String label) {
    return Text(
      label,
      style: GoogleFonts.poppins(
        color: Colors.white,
        fontSize: 13,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildField(
    TextEditingController controller,
    String label,
    IconData icon, {
    bool isPassword = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword && !_isPasswordVisible,
      keyboardType: keyboardType,
      style: GoogleFonts.poppins(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.poppins(color: Colors.white70, fontSize: 13),
        prefixIcon: Icon(icon, color: Colors.white70, size: 20),
        suffixIcon: isPassword
            ? IconButton(
                icon: Icon(
                  _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                  color: Colors.white70,
                  size: 20,
                ),
                onPressed: () =>
                    setState(() => _isPasswordVisible = !_isPasswordVisible),
              )
            : null,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.white, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.white70),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.white, width: 2),
        ),
        errorStyle: GoogleFonts.poppins(color: Colors.white70, fontSize: 11),
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      validator: (value) =>
          value == null || value.trim().isEmpty ? 'Required' : null,
    );
  }

  Widget _buildImagePicker() {
    return GestureDetector(
      onTap: _pickProfilePicture,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            _profilePictureFile != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      _profilePictureFile!,
                      width: 40,
                      height: 40,
                      fit: BoxFit.cover,
                    ),
                  )
                : Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.add_a_photo_outlined,
                        color: Colors.white70, size: 20),
                  ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                _profilePictureFile != null
                    ? _profilePictureFile!.path.split('/').last
                    : 'Tap to choose a photo',
                style: GoogleFonts.poppins(color: Colors.white70, fontSize: 13),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white54),
          ],
        ),
      ),
    );
  }

  Widget _buildRegisterButton() {
    return Container(
      height: 55,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        gradient: const LinearGradient(
          colors: [Color(0xFF34D399), Color(0xFF059669)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF059669).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        ),
        onPressed: _isSubmitting ? null : _handleRegister,
        child: _isSubmitting
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2),
              )
            : Text(
                'CREATE ACCOUNT',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }
}
