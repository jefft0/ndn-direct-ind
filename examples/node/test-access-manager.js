/*
 * Copyright (C) 2020 Operant Networks, Incorporated.
 * @author: Jeff Thompson <jefft0@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version, with the additional exemption that
 * compiling, linking, and/or using OpenSSL is allowed.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * A copy of the GNU Lesser General Public License is in the file COPYING.
 */

/**
 * This example implements an Access Manager for Name-based Access Control using
 * a group content key (GCK). It generates the GCK and and encrypts it for the
 * access member whose certificate is hard-wired. This registers with the local
 * NFD and keeps running to serve the GCK Data packet. This example works with
 * test-secured-interest-sender and test-secured-interest-responder.
 */

var Face = require('../..').Face;
var Name = require('../..').Name;
var Blob = require('../..').Blob;
var Interest = require('../..').Interest;
var KeyChain = require('../..').KeyChain;
var CertificateV2 = require('../..').CertificateV2;
var EncryptAlgorithmType = require('../..').EncryptAlgorithmType;
var EncryptorV2 = require('../..').EncryptorV2;
var AccessManagerV2 = require('../..').AccessManagerV2;

/**
 * Get the certificates of the group members.
 * @param {Array<CertificateV2>} certificates Add the certificates to this array.
 * This does not first clear the array.
 */
function getMemberCertificates(certificates)
{
  // This is from firstMemberSafeBagEncoding in test-secured-interest-sender.js.
  var firstMemberCertificateEncoding = Buffer.from([
0x06, 0xfd, 0x02, 0xb7, 0x07, 0x2d, 0x08, 0x05, 0x66, 0x69, 0x72, 0x73, 0x74, 0x08, 0x04, 0x75,
0x73, 0x65, 0x72, 0x08, 0x03, 0x4b, 0x45, 0x59, 0x08, 0x08, 0x0c, 0x87, 0xeb, 0xe6, 0x55, 0x27,
0x42, 0xd6, 0x08, 0x04, 0x73, 0x65, 0x6c, 0x66, 0x08, 0x09, 0xfd, 0x00, 0x00, 0x01, 0x49, 0x9d,
0x59, 0x8c, 0xa0, 0x14, 0x09, 0x18, 0x01, 0x02, 0x19, 0x04, 0x00, 0x36, 0xee, 0x80, 0x15, 0xfd,
0x01, 0x26, 0x30, 0x82, 0x01, 0x22, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d,
0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 0x0f, 0x00, 0x30, 0x82, 0x01, 0x0a, 0x02, 0x82,
0x01, 0x01, 0x00, 0xb9, 0xfb, 0xea, 0x51, 0x88, 0x7b, 0xe5, 0x9a, 0x2b, 0x94, 0xca, 0xf8, 0x3e,
0x70, 0x4d, 0x94, 0x3f, 0x16, 0x2a, 0xdc, 0x81, 0x0e, 0x51, 0xf9, 0xaf, 0x4f, 0xb2, 0x73, 0xff,
0xdb, 0x1e, 0x78, 0x26, 0xfc, 0x8a, 0xa2, 0x89, 0xad, 0x11, 0x14, 0xc1, 0x36, 0xa1, 0x82, 0x75,
0xda, 0x0d, 0x42, 0x8d, 0xa6, 0x9b, 0x2c, 0xf4, 0xe5, 0xc5, 0xdc, 0xea, 0xb0, 0xc3, 0x15, 0x4f,
0x67, 0x0a, 0x05, 0x36, 0x55, 0x63, 0xf0, 0x2f, 0xf9, 0xc1, 0x24, 0x65, 0x3f, 0xbf, 0x36, 0x08,
0x25, 0xb1, 0x60, 0x24, 0x0d, 0x0f, 0xfc, 0x1f, 0x93, 0xb7, 0x49, 0x15, 0x60, 0x6e, 0x50, 0x0c,
0x7b, 0x48, 0xd4, 0xd1, 0xf4, 0x19, 0x50, 0xbd, 0x61, 0x25, 0xb6, 0xa1, 0x2e, 0xb1, 0x01, 0x96,
0x8e, 0xfd, 0x1e, 0xfd, 0xd7, 0xca, 0xe5, 0xab, 0x6a, 0xe5, 0xde, 0x8c, 0x33, 0xe2, 0xf9, 0x1f,
0xaa, 0x5d, 0x6a, 0x35, 0x13, 0x1b, 0x2f, 0x77, 0x83, 0x33, 0xfc, 0x6f, 0x35, 0x9d, 0x73, 0x9f,
0x07, 0x78, 0x7b, 0xdd, 0x74, 0xef, 0x37, 0x26, 0x86, 0x72, 0xe4, 0xcf, 0xb4, 0xfe, 0xfb, 0x48,
0x36, 0xfe, 0x91, 0xf3, 0xc3, 0xdc, 0x3f, 0x7f, 0xc6, 0x75, 0x32, 0x55, 0x5e, 0xbe, 0x29, 0x39,
0x95, 0xd6, 0xd0, 0x83, 0x54, 0x2f, 0x99, 0x0d, 0xe8, 0x6f, 0x56, 0x4a, 0x05, 0xcd, 0xc9, 0xfe,
0x57, 0x6e, 0x1f, 0xbf, 0x1f, 0xca, 0x61, 0x6d, 0x21, 0x49, 0x46, 0x7d, 0x1d, 0xd8, 0x3a, 0x17,
0x67, 0x7f, 0x5f, 0xa6, 0xad, 0x12, 0x68, 0x6a, 0xbe, 0xdd, 0x58, 0x44, 0x78, 0x50, 0xd2, 0xa1,
0x50, 0xa3, 0xcd, 0x9e, 0x2e, 0x2d, 0x62, 0x34, 0x02, 0xe7, 0xec, 0xfc, 0xdd, 0x6b, 0x29, 0x41,
0x66, 0x6d, 0x01, 0xb6, 0x5a, 0xb8, 0xc7, 0x7b, 0xef, 0x6f, 0x70, 0x26, 0x47, 0x6b, 0x1f, 0xb1,
0xa2, 0xa8, 0x25, 0x02, 0x03, 0x01, 0x00, 0x01, 0x16, 0x4d, 0x1b, 0x01, 0x01, 0x1c, 0x1e, 0x07,
0x1c, 0x08, 0x05, 0x66, 0x69, 0x72, 0x73, 0x74, 0x08, 0x04, 0x75, 0x73, 0x65, 0x72, 0x08, 0x03,
0x4b, 0x45, 0x59, 0x08, 0x08, 0x0c, 0x87, 0xeb, 0xe6, 0x55, 0x27, 0x42, 0xd6, 0xfd, 0x00, 0xfd,
0x26, 0xfd, 0x00, 0xfe, 0x0f, 0x31, 0x39, 0x37, 0x30, 0x30, 0x31, 0x30, 0x31, 0x54, 0x30, 0x30,
0x30, 0x30, 0x30, 0x30, 0xfd, 0x00, 0xff, 0x0f, 0x32, 0x30, 0x33, 0x34, 0x31, 0x31, 0x30, 0x36,
0x54, 0x30, 0x35, 0x33, 0x35, 0x33, 0x32, 0x17, 0xfd, 0x01, 0x00, 0x6c, 0xc0, 0x96, 0x33, 0x99,
0xb7, 0xb3, 0xc0, 0x75, 0xab, 0x29, 0x8b, 0xa6, 0xe1, 0x9b, 0xcc, 0xd4, 0x59, 0x03, 0x94, 0x65,
0xbb, 0xde, 0x26, 0x18, 0x2c, 0x8b, 0x27, 0xec, 0x64, 0xbd, 0x85, 0xf7, 0x76, 0x15, 0x9f, 0x86,
0xf7, 0xb2, 0x09, 0x86, 0xa4, 0x2a, 0x85, 0xb0, 0xcc, 0x59, 0x06, 0x74, 0x94, 0x2e, 0xd2, 0xd9,
0x98, 0xde, 0x9a, 0xea, 0xc7, 0x72, 0x8e, 0x5a, 0x05, 0xa4, 0x8a, 0x1e, 0x3c, 0x74, 0x90, 0x71,
0xcd, 0xef, 0xc6, 0xd0, 0x46, 0xb6, 0x7c, 0x2f, 0xa0, 0xca, 0xd1, 0xcd, 0x38, 0x4d, 0xb2, 0x67,
0x3a, 0xb3, 0xe6, 0x08, 0x2d, 0xa3, 0x1f, 0xfa, 0x59, 0x02, 0xc8, 0x20, 0xc0, 0xab, 0x67, 0xd3,
0x3c, 0x4f, 0x11, 0xa3, 0x3c, 0xf2, 0xe5, 0xc3, 0xd8, 0x91, 0xcb, 0xd0, 0x03, 0x96, 0x62, 0x33,
0xf7, 0x11, 0x35, 0x00, 0x9d, 0x48, 0xfe, 0x70, 0x85, 0xa4, 0x5b, 0xe6, 0x35, 0x24, 0xf8, 0x81,
0x4c, 0x3e, 0x89, 0xf9, 0x03, 0x96, 0x89, 0xc9, 0xfd, 0xf0, 0xcc, 0xab, 0x45, 0x94, 0x79, 0x5b,
0xee, 0xba, 0xef, 0x01, 0x0b, 0xa5, 0xab, 0x79, 0xc0, 0xef, 0x8e, 0xb8, 0x6a, 0x7c, 0x6f, 0xcf,
0xd7, 0x58, 0xfe, 0x36, 0x89, 0xb1, 0x17, 0x79, 0xeb, 0x7e, 0xed, 0xd2, 0x67, 0x53, 0x44, 0x7f,
0x17, 0x13, 0x52, 0xc7, 0xa5, 0xeb, 0xd8, 0x42, 0x72, 0x7a, 0xea, 0x24, 0x47, 0x1f, 0x63, 0xe1,
0x0d, 0x88, 0xe4, 0xd6, 0x05, 0x39, 0x28, 0xdf, 0x80, 0xfa, 0xef, 0xb4, 0x60, 0xf2, 0x28, 0xbd,
0x6e, 0x08, 0x22, 0x25, 0x35, 0xc1, 0x80, 0x40, 0x54, 0x5b, 0xa4, 0xca, 0x2c, 0xd9, 0xf8, 0xdd,
0x95, 0x1d, 0xf5, 0x56, 0x28, 0x32, 0xd3, 0xb0, 0x8e, 0xe3, 0x80, 0xfb, 0xfb, 0xc0, 0xdc, 0x32,
0x24, 0x00, 0x69, 0x71, 0xc4, 0x51, 0xdf, 0x1a, 0x7b, 0xa5, 0xf5
  ]);
  var firstMemberCertificate = new CertificateV2();
  firstMemberCertificate.wireDecode(new Blob(firstMemberCertificateEncoding, false));
  certificates.push(firstMemberCertificate);

  // This is from secondMemberSafeBagEncoding in test-secured-interest-responder.js.
  var secondMemberCertificateEncoding = Buffer.from([
0x06, 0xfd, 0x02, 0xb9, 0x07, 0x2e, 0x08, 0x06, 0x73, 0x65, 0x63, 0x6f, 0x6e, 0x64, 0x08, 0x04,
0x75, 0x73, 0x65, 0x72, 0x08, 0x03, 0x4b, 0x45, 0x59, 0x08, 0x08, 0x46, 0x7e, 0xa8, 0xc5, 0xf6,
0x5c, 0xb7, 0x55, 0x08, 0x04, 0x73, 0x65, 0x6c, 0x66, 0x08, 0x09, 0xfd, 0x00, 0x00, 0x01, 0x74,
0xb1, 0x7b, 0xd9, 0xd9, 0x14, 0x09, 0x18, 0x01, 0x02, 0x19, 0x04, 0x00, 0x36, 0xee, 0x80, 0x15,
0xfd, 0x01, 0x26, 0x30, 0x82, 0x01, 0x22, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7,
0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 0x0f, 0x00, 0x30, 0x82, 0x01, 0x0a, 0x02,
0x82, 0x01, 0x01, 0x00, 0xb3, 0x8c, 0x40, 0x89, 0xf4, 0x5d, 0x0b, 0xc6, 0x97, 0x4c, 0x6c, 0x50,
0x54, 0xa1, 0x05, 0x86, 0x46, 0x57, 0x7e, 0x57, 0xc0, 0x0d, 0xb0, 0xf6, 0xae, 0xc1, 0x12, 0x48,
0x4a, 0x4d, 0x78, 0x75, 0x9d, 0xae, 0x2c, 0x11, 0xed, 0xc9, 0xce, 0x97, 0x01, 0xad, 0x32, 0xff,
0x35, 0x2f, 0x53, 0xc3, 0x58, 0xe6, 0x41, 0xa6, 0xaa, 0x1c, 0xbf, 0xc5, 0x25, 0x0e, 0x2d, 0xe7,
0x19, 0xb3, 0x6a, 0x8d, 0xee, 0xe6, 0x8c, 0x01, 0xa2, 0xe1, 0x83, 0x31, 0x17, 0xfe, 0xaf, 0x11,
0xa6, 0x07, 0x0b, 0x79, 0xa3, 0xd9, 0xb1, 0x07, 0xca, 0xe4, 0x32, 0x3e, 0xe7, 0x39, 0x95, 0x36,
0x36, 0xd9, 0xd7, 0x08, 0xaa, 0xc3, 0x94, 0x71, 0xbb, 0x94, 0x89, 0xd8, 0x3f, 0x4a, 0xb7, 0xc2,
0x9a, 0x9a, 0x91, 0xa5, 0xa7, 0x11, 0x40, 0x3f, 0xca, 0x6c, 0xb2, 0x63, 0x41, 0x34, 0xb7, 0xde,
0x14, 0x40, 0xbc, 0x7d, 0x0e, 0x86, 0x30, 0xad, 0x80, 0x54, 0x8f, 0x84, 0xf3, 0x9c, 0x82, 0x86,
0xf1, 0xcb, 0x5a, 0xa1, 0x92, 0xa2, 0x70, 0x48, 0xa2, 0x82, 0x56, 0x04, 0x9f, 0x82, 0x21, 0x55,
0xeb, 0x9a, 0xd3, 0x4d, 0x2b, 0x29, 0x44, 0x90, 0x3f, 0xa5, 0x80, 0x8f, 0xad, 0xa8, 0x90, 0x71,
0x85, 0x36, 0xd4, 0x75, 0x3b, 0x4b, 0x52, 0x0d, 0xa4, 0x57, 0x1a, 0x53, 0xef, 0x04, 0x35, 0x40,
0x30, 0x0f, 0xc0, 0x93, 0x5c, 0x87, 0x15, 0x7d, 0x11, 0xf4, 0xb8, 0xa8, 0xe4, 0x62, 0xdb, 0x85,
0xc4, 0xe2, 0xf1, 0x8a, 0x43, 0xdb, 0x01, 0x9f, 0x9a, 0xdb, 0x46, 0xab, 0xd1, 0xd4, 0x07, 0xaa,
0x4b, 0xf8, 0xb1, 0xe8, 0xaa, 0x80, 0x82, 0xc6, 0x06, 0x14, 0xb6, 0x08, 0x85, 0x7b, 0xb3, 0xfc,
0xb0, 0x2a, 0x68, 0x1d, 0xe9, 0xac, 0xeb, 0xf8, 0x93, 0xea, 0x3b, 0x67, 0x49, 0x10, 0x79, 0x11,
0x56, 0x5b, 0x2d, 0x63, 0x02, 0x03, 0x01, 0x00, 0x01, 0x16, 0x4e, 0x1b, 0x01, 0x01, 0x1c, 0x1f,
0x07, 0x1d, 0x08, 0x06, 0x73, 0x65, 0x63, 0x6f, 0x6e, 0x64, 0x08, 0x04, 0x75, 0x73, 0x65, 0x72,
0x08, 0x03, 0x4b, 0x45, 0x59, 0x08, 0x08, 0x46, 0x7e, 0xa8, 0xc5, 0xf6, 0x5c, 0xb7, 0x55, 0xfd,
0x00, 0xfd, 0x26, 0xfd, 0x00, 0xfe, 0x0f, 0x32, 0x30, 0x32, 0x30, 0x30, 0x39, 0x32, 0x31, 0x54,
0x31, 0x36, 0x32, 0x35, 0x31, 0x39, 0xfd, 0x00, 0xff, 0x0f, 0x32, 0x30, 0x34, 0x30, 0x30, 0x39,
0x31, 0x36, 0x54, 0x31, 0x36, 0x32, 0x35, 0x31, 0x38, 0x17, 0xfd, 0x01, 0x00, 0xa2, 0xc8, 0xc5,
0x17, 0x26, 0x46, 0x89, 0x01, 0x29, 0x15, 0xb9, 0x5c, 0x84, 0x38, 0x03, 0x54, 0xc9, 0x9e, 0x62,
0x19, 0xa6, 0xaa, 0x43, 0xac, 0xcb, 0x32, 0x8d, 0xd2, 0x1b, 0x8d, 0x47, 0x24, 0xbf, 0x49, 0x54,
0xb4, 0x1c, 0x40, 0x57, 0x88, 0x2a, 0x83, 0x61, 0xa5, 0x58, 0x3c, 0x74, 0x35, 0x61, 0x23, 0x75,
0x67, 0x4c, 0xfc, 0x7f, 0xcf, 0x48, 0x1f, 0x41, 0x16, 0xb8, 0x70, 0x1f, 0x91, 0xfe, 0xa0, 0x16,
0x76, 0x6c, 0xc7, 0x7a, 0xf0, 0xcc, 0x14, 0xb9, 0xd5, 0xed, 0x19, 0xe9, 0xec, 0xa0, 0x88, 0xa7,
0xb3, 0xc0, 0xe2, 0xd6, 0x71, 0x22, 0xa8, 0x70, 0xfa, 0x64, 0x54, 0x1b, 0x46, 0x2e, 0x20, 0xd0,
0x39, 0xc8, 0x2f, 0xb8, 0x70, 0xdc, 0x81, 0xe6, 0x70, 0xd5, 0x6f, 0x6e, 0x94, 0x75, 0xee, 0xd9,
0xd3, 0x75, 0x74, 0xfe, 0x87, 0xaa, 0x25, 0x29, 0x71, 0xbd, 0x62, 0xb7, 0x70, 0x22, 0x30, 0x4a,
0x69, 0xed, 0x07, 0x12, 0xab, 0x21, 0x84, 0xb1, 0x1f, 0x79, 0xce, 0xce, 0x9a, 0x0a, 0x55, 0x1d,
0x16, 0xf7, 0x3c, 0x9a, 0xd2, 0x52, 0x8b, 0x93, 0xb1, 0x82, 0xda, 0xdd, 0x69, 0xf2, 0xcc, 0x69,
0xfd, 0x80, 0x26, 0x64, 0xb8, 0xe5, 0x81, 0xd3, 0x93, 0xb0, 0xdc, 0xe0, 0x87, 0xa8, 0x52, 0x39,
0x02, 0xa3, 0x38, 0xd2, 0x4b, 0x11, 0x64, 0x78, 0xff, 0x18, 0x65, 0x11, 0xb1, 0x92, 0xcb, 0x37,
0x29, 0xdd, 0x85, 0x67, 0x79, 0x20, 0x73, 0xa0, 0xf0, 0xce, 0xfe, 0x45, 0xe1, 0x85, 0xbc, 0xb6,
0x46, 0x14, 0x9c, 0xb7, 0xa1, 0xca, 0xa8, 0x8c, 0x9d, 0xcf, 0xd1, 0x70, 0x85, 0x31, 0x42, 0x64,
0xc6, 0x87, 0x95, 0x9f, 0x01, 0x32, 0xcc, 0x3a, 0x44, 0x14, 0xce, 0x20, 0xa1, 0x4a, 0xa3, 0x49,
0x6c, 0xc1, 0x25, 0xd5, 0x10, 0x7e, 0x62, 0x4b, 0xa1, 0x7a, 0x8e, 0x0f, 0x07
  ]);
  var secondMemberCertificate = new CertificateV2();
  secondMemberCertificate.wireDecode(new Blob(secondMemberCertificateEncoding, false));
  certificates.push(secondMemberCertificate);
}

function main()
{
  var keyChain = new KeyChain("pib-memory:", "tpm-memory:");
  // Generate a fresh identity so that we don't need the system TPM.
  keyChain.createIdentityV2(new Name("/test-access-manager"));
  var face = new Face({host: "localhost"});
  face.setCommandSigningInfo(keyChain, keyChain.getDefaultCertificateName());

  var accessManagerIdentity =
    keyChain.getPib().getIdentity(keyChain.getDefaultIdentity());
  var dataset = new Name("/test-group");
  var groupName = new Name(accessManagerIdentity.getName())
    .append(EncryptorV2.NAME_COMPONENT_NAC).append(dataset);
  console.log("Access group name: " + groupName.toUri());

  var accessManager = new AccessManagerV2
    (accessManagerIdentity, dataset, keyChain, face, EncryptAlgorithmType.AesCbc);

  // Add access for the members in test-secured-interest-encryptor and -decryptor.
  var certificates = [];
  getMemberCertificates(certificates);
  for (var i = 0; i < certificates.length; ++i) {
    accessManager.addMember(certificates[i]);
    console.log
      ("Ready to serve the GCK for member: " + certificates[i].getIdentity().toUri());
  }
}

main();
