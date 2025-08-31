// File: app/api/admin/populate-base/route.ts
// Endpoint per popolare continenti e paesi nel database

import { NextRequest, NextResponse } from 'next/server';

// 🌍 DATI CONTINENTI
const CONTINENTS = [
  { name: 'Europe', code: 'EU' },
  { name: 'Asia', code: 'AS' },
  { name: 'Africa', code: 'AF' },
  { name: 'North America', code: 'NA' },
  { name: 'South America', code: 'SA' },
  { name: 'Oceania', code: 'OC' }
];

// 🏳️ DATI PAESI (196 paesi completi)
const COUNTRIES = [
  // EUROPA (44 paesi)
  { continent_code: 'EU', name: 'Albania', code: 'AL', flag_url: 'https://flagcdn.com/w320/al.png' },
  { continent_code: 'EU', name: 'Andorra', code: 'AD', flag_url: 'https://flagcdn.com/w320/ad.png' },
  { continent_code: 'EU', name: 'Austria', code: 'AT', flag_url: 'https://flagcdn.com/w320/at.png' },
  { continent_code: 'EU', name: 'Belarus', code: 'BY', flag_url: 'https://flagcdn.com/w320/by.png' },
  { continent_code: 'EU', name: 'Belgium', code: 'BE', flag_url: 'https://flagcdn.com/w320/be.png' },
  { continent_code: 'EU', name: 'Bosnia and Herzegovina', code: 'BA', flag_url: 'https://flagcdn.com/w320/ba.png' },
  { continent_code: 'EU', name: 'Bulgaria', code: 'BG', flag_url: 'https://flagcdn.com/w320/bg.png' },
  { continent_code: 'EU', name: 'Croatia', code: 'HR', flag_url: 'https://flagcdn.com/w320/hr.png' },
  { continent_code: 'EU', name: 'Cyprus', code: 'CY', flag_url: 'https://flagcdn.com/w320/cy.png' },
  { continent_code: 'EU', name: 'Czech Republic', code: 'CZ', flag_url: 'https://flagcdn.com/w320/cz.png' },
  { continent_code: 'EU', name: 'Denmark', code: 'DK', flag_url: 'https://flagcdn.com/w320/dk.png' },
  { continent_code: 'EU', name: 'Estonia', code: 'EE', flag_url: 'https://flagcdn.com/w320/ee.png' },
  { continent_code: 'EU', name: 'Finland', code: 'FI', flag_url: 'https://flagcdn.com/w320/fi.png' },
  { continent_code: 'EU', name: 'France', code: 'FR', flag_url: 'https://flagcdn.com/w320/fr.png' },
  { continent_code: 'EU', name: 'Germany', code: 'DE', flag_url: 'https://flagcdn.com/w320/de.png' },
  { continent_code: 'EU', name: 'Greece', code: 'GR', flag_url: 'https://flagcdn.com/w320/gr.png' },
  { continent_code: 'EU', name: 'Hungary', code: 'HU', flag_url: 'https://flagcdn.com/w320/hu.png' },
  { continent_code: 'EU', name: 'Iceland', code: 'IS', flag_url: 'https://flagcdn.com/w320/is.png' },
  { continent_code: 'EU', name: 'Ireland', code: 'IE', flag_url: 'https://flagcdn.com/w320/ie.png' },
  { continent_code: 'EU', name: 'Italy', code: 'IT', flag_url: 'https://flagcdn.com/w320/it.png' },
  { continent_code: 'EU', name: 'Latvia', code: 'LV', flag_url: 'https://flagcdn.com/w320/lv.png' },
  { continent_code: 'EU', name: 'Liechtenstein', code: 'LI', flag_url: 'https://flagcdn.com/w320/li.png' },
  { continent_code: 'EU', name: 'Lithuania', code: 'LT', flag_url: 'https://flagcdn.com/w320/lt.png' },
  { continent_code: 'EU', name: 'Luxembourg', code: 'LU', flag_url: 'https://flagcdn.com/w320/lu.png' },
  { continent_code: 'EU', name: 'Malta', code: 'MT', flag_url: 'https://flagcdn.com/w320/mt.png' },
  { continent_code: 'EU', name: 'Moldova', code: 'MD', flag_url: 'https://flagcdn.com/w320/md.png' },
  { continent_code: 'EU', name: 'Monaco', code: 'MC', flag_url: 'https://flagcdn.com/w320/mc.png' },
  { continent_code: 'EU', name: 'Montenegro', code: 'ME', flag_url: 'https://flagcdn.com/w320/me.png' },
  { continent_code: 'EU', name: 'Netherlands', code: 'NL', flag_url: 'https://flagcdn.com/w320/nl.png' },
  { continent_code: 'EU', name: 'North Macedonia', code: 'MK', flag_url: 'https://flagcdn.com/w320/mk.png' },
  { continent_code: 'EU', name: 'Norway', code: 'NO', flag_url: 'https://flagcdn.com/w320/no.png' },
  { continent_code: 'EU', name: 'Poland', code: 'PL', flag_url: 'https://flagcdn.com/w320/pl.png' },
  { continent_code: 'EU', name: 'Portugal', code: 'PT', flag_url: 'https://flagcdn.com/w320/pt.png' },
  { continent_code: 'EU', name: 'Romania', code: 'RO', flag_url: 'https://flagcdn.com/w320/ro.png' },
  { continent_code: 'EU', name: 'Russia', code: 'RU', flag_url: 'https://flagcdn.com/w320/ru.png' },
  { continent_code: 'EU', name: 'San Marino', code: 'SM', flag_url: 'https://flagcdn.com/w320/sm.png' },
  { continent_code: 'EU', name: 'Serbia', code: 'RS', flag_url: 'https://flagcdn.com/w320/rs.png' },
  { continent_code: 'EU', name: 'Slovakia', code: 'SK', flag_url: 'https://flagcdn.com/w320/sk.png' },
  { continent_code: 'EU', name: 'Slovenia', code: 'SI', flag_url: 'https://flagcdn.com/w320/si.png' },
  { continent_code: 'EU', name: 'Spain', code: 'ES', flag_url: 'https://flagcdn.com/w320/es.png' },
  { continent_code: 'EU', name: 'Sweden', code: 'SE', flag_url: 'https://flagcdn.com/w320/se.png' },
  { continent_code: 'EU', name: 'Switzerland', code: 'CH', flag_url: 'https://flagcdn.com/w320/ch.png' },
  { continent_code: 'EU', name: 'Ukraine', code: 'UA', flag_url: 'https://flagcdn.com/w320/ua.png' },
  { continent_code: 'EU', name: 'United Kingdom', code: 'GB', flag_url: 'https://flagcdn.com/w320/gb.png' },
  { continent_code: 'EU', name: 'Vatican City', code: 'VA', flag_url: 'https://flagcdn.com/w320/va.png' },

  // ASIA (47 paesi)
  { continent_code: 'AS', name: 'Afghanistan', code: 'AF', flag_url: 'https://flagcdn.com/w320/af.png' },
  { continent_code: 'AS', name: 'Armenia', code: 'AM', flag_url: 'https://flagcdn.com/w320/am.png' },
  { continent_code: 'AS', name: 'Azerbaijan', code: 'AZ', flag_url: 'https://flagcdn.com/w320/az.png' },
  { continent_code: 'AS', name: 'Bahrain', code: 'BH', flag_url: 'https://flagcdn.com/w320/bh.png' },
  { continent_code: 'AS', name: 'Bangladesh', code: 'BD', flag_url: 'https://flagcdn.com/w320/bd.png' },
  { continent_code: 'AS', name: 'Bhutan', code: 'BT', flag_url: 'https://flagcdn.com/w320/bt.png' },
  { continent_code: 'AS', name: 'Brunei', code: 'BN', flag_url: 'https://flagcdn.com/w320/bn.png' },
  { continent_code: 'AS', name: 'Cambodia', code: 'KH', flag_url: 'https://flagcdn.com/w320/kh.png' },
  { continent_code: 'AS', name: 'China', code: 'CN', flag_url: 'https://flagcdn.com/w320/cn.png' },
  { continent_code: 'AS', name: 'Georgia', code: 'GE', flag_url: 'https://flagcdn.com/w320/ge.png' },
  { continent_code: 'AS', name: 'India', code: 'IN', flag_url: 'https://flagcdn.com/w320/in.png' },
  { continent_code: 'AS', name: 'Indonesia', code: 'ID', flag_url: 'https://flagcdn.com/w320/id.png' },
  { continent_code: 'AS', name: 'Iran', code: 'IR', flag_url: 'https://flagcdn.com/w320/ir.png' },
  { continent_code: 'AS', name: 'Iraq', code: 'IQ', flag_url: 'https://flagcdn.com/w320/iq.png' },
  { continent_code: 'AS', name: 'Israel', code: 'IL', flag_url: 'https://flagcdn.com/w320/il.png' },
  { continent_code: 'AS', name: 'Japan', code: 'JP', flag_url: 'https://flagcdn.com/w320/jp.png' },
  { continent_code: 'AS', name: 'Jordan', code: 'JO', flag_url: 'https://flagcdn.com/w320/jo.png' },
  { continent_code: 'AS', name: 'Kazakhstan', code: 'KZ', flag_url: 'https://flagcdn.com/w320/kz.png' },
  { continent_code: 'AS', name: 'Kuwait', code: 'KW', flag_url: 'https://flagcdn.com/w320/kw.png' },
  { continent_code: 'AS', name: 'Kyrgyzstan', code: 'KG', flag_url: 'https://flagcdn.com/w320/kg.png' },
  { continent_code: 'AS', name: 'Laos', code: 'LA', flag_url: 'https://flagcdn.com/w320/la.png' },
  { continent_code: 'AS', name: 'Lebanon', code: 'LB', flag_url: 'https://flagcdn.com/w320/lb.png' },
  { continent_code: 'AS', name: 'Malaysia', code: 'MY', flag_url: 'https://flagcdn.com/w320/my.png' },
  { continent_code: 'AS', name: 'Maldives', code: 'MV', flag_url: 'https://flagcdn.com/w320/mv.png' },
  { continent_code: 'AS', name: 'Mongolia', code: 'MN', flag_url: 'https://flagcdn.com/w320/mn.png' },
  { continent_code: 'AS', name: 'Myanmar', code: 'MM', flag_url: 'https://flagcdn.com/w320/mm.png' },
  { continent_code: 'AS', name: 'Nepal', code: 'NP', flag_url: 'https://flagcdn.com/w320/np.png' },
  { continent_code: 'AS', name: 'North Korea', code: 'KP', flag_url: 'https://flagcdn.com/w320/kp.png' },
  { continent_code: 'AS', name: 'Oman', code: 'OM', flag_url: 'https://flagcdn.com/w320/om.png' },
  { continent_code: 'AS', name: 'Pakistan', code: 'PK', flag_url: 'https://flagcdn.com/w320/pk.png' },
  { continent_code: 'AS', name: 'Palestine', code: 'PS', flag_url: 'https://flagcdn.com/w320/ps.png' },
  { continent_code: 'AS', name: 'Philippines', code: 'PH', flag_url: 'https://flagcdn.com/w320/ph.png' },
  { continent_code: 'AS', name: 'Qatar', code: 'QA', flag_url: 'https://flagcdn.com/w320/qa.png' },
  { continent_code: 'AS', name: 'Saudi Arabia', code: 'SA', flag_url: 'https://flagcdn.com/w320/sa.png' },
  { continent_code: 'AS', name: 'Singapore', code: 'SG', flag_url: 'https://flagcdn.com/w320/sg.png' },
  { continent_code: 'AS', name: 'South Korea', code: 'KR', flag_url: 'https://flagcdn.com/w320/kr.png' },
  { continent_code: 'AS', name: 'Sri Lanka', code: 'LK', flag_url: 'https://flagcdn.com/w320/lk.png' },
  { continent_code: 'AS', name: 'Syria', code: 'SY', flag_url: 'https://flagcdn.com/w320/sy.png' },
  { continent_code: 'AS', name: 'Taiwan', code: 'TW', flag_url: 'https://flagcdn.com/w320/tw.png' },
  { continent_code: 'AS', name: 'Tajikistan', code: 'TJ', flag_url: 'https://flagcdn.com/w320/tj.png' },
  { continent_code: 'AS', name: 'Thailand', code: 'TH', flag_url: 'https://flagcdn.com/w320/th.png' },
  { continent_code: 'AS', name: 'Timor-Leste', code: 'TL', flag_url: 'https://flagcdn.com/w320/tl.png' },
  { continent_code: 'AS', name: 'Turkey', code: 'TR', flag_url: 'https://flagcdn.com/w320/tr.png' },
  { continent_code: 'AS', name: 'Turkmenistan', code: 'TM', flag_url: 'https://flagcdn.com/w320/tm.png' },
  { continent_code: 'AS', name: 'United Arab Emirates', code: 'AE', flag_url: 'https://flagcdn.com/w320/ae.png' },
  { continent_code: 'AS', name: 'Uzbekistan', code: 'UZ', flag_url: 'https://flagcdn.com/w320/uz.png' },
  { continent_code: 'AS', name: 'Vietnam', code: 'VN', flag_url: 'https://flagcdn.com/w320/vn.png' },
  { continent_code: 'AS', name: 'Yemen', code: 'YE', flag_url: 'https://flagcdn.com/w320/ye.png' },

  // AFRICA (54 paesi)
  { continent_code: 'AF', name: 'Algeria', code: 'DZ', flag_url: 'https://flagcdn.com/w320/dz.png' },
  { continent_code: 'AF', name: 'Angola', code: 'AO', flag_url: 'https://flagcdn.com/w320/ao.png' },
  { continent_code: 'AF', name: 'Benin', code: 'BJ', flag_url: 'https://flagcdn.com/w320/bj.png' },
  { continent_code: 'AF', name: 'Botswana', code: 'BW', flag_url: 'https://flagcdn.com/w320/bw.png' },
  { continent_code: 'AF', name: 'Burkina Faso', code: 'BF', flag_url: 'https://flagcdn.com/w320/bf.png' },
  { continent_code: 'AF', name: 'Burundi', code: 'BI', flag_url: 'https://flagcdn.com/w320/bi.png' },
  { continent_code: 'AF', name: 'Cabo Verde', code: 'CV', flag_url: 'https://flagcdn.com/w320/cv.png' },
  { continent_code: 'AF', name: 'Cameroon', code: 'CM', flag_url: 'https://flagcdn.com/w320/cm.png' },
  { continent_code: 'AF', name: 'Central African Republic', code: 'CF', flag_url: 'https://flagcdn.com/w320/cf.png' },
  { continent_code: 'AF', name: 'Chad', code: 'TD', flag_url: 'https://flagcdn.com/w320/td.png' },
  { continent_code: 'AF', name: 'Comoros', code: 'KM', flag_url: 'https://flagcdn.com/w320/km.png' },
  { continent_code: 'AF', name: 'Congo', code: 'CG', flag_url: 'https://flagcdn.com/w320/cg.png' },
  { continent_code: 'AF', name: 'Democratic Republic of the Congo', code: 'CD', flag_url: 'https://flagcdn.com/w320/cd.png' },
  { continent_code: 'AF', name: 'Djibouti', code: 'DJ', flag_url: 'https://flagcdn.com/w320/dj.png' },
  { continent_code: 'AF', name: 'Egypt', code: 'EG', flag_url: 'https://flagcdn.com/w320/eg.png' },
  { continent_code: 'AF', name: 'Equatorial Guinea', code: 'GQ', flag_url: 'https://flagcdn.com/w320/gq.png' },
  { continent_code: 'AF', name: 'Eritrea', code: 'ER', flag_url: 'https://flagcdn.com/w320/er.png' },
  { continent_code: 'AF', name: 'Eswatini', code: 'SZ', flag_url: 'https://flagcdn.com/w320/sz.png' },
  { continent_code: 'AF', name: 'Ethiopia', code: 'ET', flag_url: 'https://flagcdn.com/w320/et.png' },
  { continent_code: 'AF', name: 'Gabon', code: 'GA', flag_url: 'https://flagcdn.com/w320/ga.png' },
  { continent_code: 'AF', name: 'Gambia', code: 'GM', flag_url: 'https://flagcdn.com/w320/gm.png' },
  { continent_code: 'AF', name: 'Ghana', code: 'GH', flag_url: 'https://flagcdn.com/w320/gh.png' },
  { continent_code: 'AF', name: 'Guinea', code: 'GN', flag_url: 'https://flagcdn.com/w320/gn.png' },
  { continent_code: 'AF', name: 'Guinea-Bissau', code: 'GW', flag_url: 'https://flagcdn.com/w320/gw.png' },
  { continent_code: 'AF', name: 'Ivory Coast', code: 'CI', flag_url: 'https://flagcdn.com/w320/ci.png' },
  { continent_code: 'AF', name: 'Kenya', code: 'KE', flag_url: 'https://flagcdn.com/w320/ke.png' },
  { continent_code: 'AF', name: 'Lesotho', code: 'LS', flag_url: 'https://flagcdn.com/w320/ls.png' },
  { continent_code: 'AF', name: 'Liberia', code: 'LR', flag_url: 'https://flagcdn.com/w320/lr.png' },
  { continent_code: 'AF', name: 'Libya', code: 'LY', flag_url: 'https://flagcdn.com/w320/ly.png' },
  { continent_code: 'AF', name: 'Madagascar', code: 'MG', flag_url: 'https://flagcdn.com/w320/mg.png' },
  { continent_code: 'AF', name: 'Malawi', code: 'MW', flag_url: 'https://flagcdn.com/w320/mw.png' },
  { continent_code: 'AF', name: 'Mali', code: 'ML', flag_url: 'https://flagcdn.com/w320/ml.png' },
  { continent_code: 'AF', name: 'Mauritania', code: 'MR', flag_url: 'https://flagcdn.com/w320/mr.png' },
  { continent_code: 'AF', name: 'Mauritius', code: 'MU', flag_url: 'https://flagcdn.com/w320/mu.png' },
  { continent_code: 'AF', name: 'Morocco', code: 'MA', flag_url: 'https://flagcdn.com/w320/ma.png' },
  { continent_code: 'AF', name: 'Mozambique', code: 'MZ', flag_url: 'https://flagcdn.com/w320/mz.png' },
  { continent_code: 'AF', name: 'Namibia', code: 'NA', flag_url: 'https://flagcdn.com/w320/na.png' },
  { continent_code: 'AF', name: 'Niger', code: 'NE', flag_url: 'https://flagcdn.com/w320/ne.png' },
  { continent_code: 'AF', name: 'Nigeria', code: 'NG', flag_url: 'https://flagcdn.com/w320/ng.png' },
  { continent_code: 'AF', name: 'Rwanda', code: 'RW', flag_url: 'https://flagcdn.com/w320/rw.png' },
  { continent_code: 'AF', name: 'São Tomé and Príncipe', code: 'ST', flag_url: 'https://flagcdn.com/w320/st.png' },
  { continent_code: 'AF', name: 'Senegal', code: 'SN', flag_url: 'https://flagcdn.com/w320/sn.png' },
  { continent_code: 'AF', name: 'Seychelles', code: 'SC', flag_url: 'https://flagcdn.com/w320/sc.png' },
  { continent_code: 'AF', name: 'Sierra Leone', code: 'SL', flag_url: 'https://flagcdn.com/w320/sl.png' },
  { continent_code: 'AF', name: 'Somalia', code: 'SO', flag_url: 'https://flagcdn.com/w320/so.png' },
  { continent_code: 'AF', name: 'South Africa', code: 'ZA', flag_url: 'https://flagcdn.com/w320/za.png' },
  { continent_code: 'AF', name: 'South Sudan', code: 'SS', flag_url: 'https://flagcdn.com/w320/ss.png' },
  { continent_code: 'AF', name: 'Sudan', code: 'SD', flag_url: 'https://flagcdn.com/w320/sd.png' },
  { continent_code: 'AF', name: 'Tanzania', code: 'TZ', flag_url: 'https://flagcdn.com/w320/tz.png' },
  { continent_code: 'AF', name: 'Togo', code: 'TG', flag_url: 'https://flagcdn.com/w320/tg.png' },
  { continent_code: 'AF', name: 'Tunisia', code: 'TN', flag_url: 'https://flagcdn.com/w320/tn.png' },
  { continent_code: 'AF', name: 'Uganda', code: 'UG', flag_url: 'https://flagcdn.com/w320/ug.png' },
  { continent_code: 'AF', name: 'Zambia', code: 'ZM', flag_url: 'https://flagcdn.com/w320/zm.png' },
  { continent_code: 'AF', name: 'Zimbabwe', code: 'ZW', flag_url: 'https://flagcdn.com/w320/zw.png' },

  // NORTH AMERICA (23 paesi)
  { continent_code: 'NA', name: 'Antigua and Barbuda', code: 'AG', flag_url: 'https://flagcdn.com/w320/ag.png' },
  { continent_code: 'NA', name: 'Bahamas', code: 'BS', flag_url: 'https://flagcdn.com/w320/bs.png' },
  { continent_code: 'NA', name: 'Barbados', code: 'BB', flag_url: 'https://flagcdn.com/w320/bb.png' },
  { continent_code: 'NA', name: 'Belize', code: 'BZ', flag_url: 'https://flagcdn.com/w320/bz.png' },
  { continent_code: 'NA', name: 'Canada', code: 'CA', flag_url: 'https://flagcdn.com/w320/ca.png' },
  { continent_code: 'NA', name: 'Costa Rica', code: 'CR', flag_url: 'https://flagcdn.com/w320/cr.png' },
  { continent_code: 'NA', name: 'Cuba', code: 'CU', flag_url: 'https://flagcdn.com/w320/cu.png' },
  { continent_code: 'NA', name: 'Dominica', code: 'DM', flag_url: 'https://flagcdn.com/w320/dm.png' },
  { continent_code: 'NA', name: 'Dominican Republic', code: 'DO', flag_url: 'https://flagcdn.com/w320/do.png' },
  { continent_code: 'NA', name: 'El Salvador', code: 'SV', flag_url: 'https://flagcdn.com/w320/sv.png' },
  { continent_code: 'NA', name: 'Grenada', code: 'GD', flag_url: 'https://flagcdn.com/w320/gd.png' },
  { continent_code: 'NA', name: 'Guatemala', code: 'GT', flag_url: 'https://flagcdn.com/w320/gt.png' },
  { continent_code: 'NA', name: 'Haiti', code: 'HT', flag_url: 'https://flagcdn.com/w320/ht.png' },
  { continent_code: 'NA', name: 'Honduras', code: 'HN', flag_url: 'https://flagcdn.com/w320/hn.png' },
  { continent_code: 'NA', name: 'Jamaica', code: 'JM', flag_url: 'https://flagcdn.com/w320/jm.png' },
  { continent_code: 'NA', name: 'Mexico', code: 'MX', flag_url: 'https://flagcdn.com/w320/mx.png' },
  { continent_code: 'NA', name: 'Nicaragua', code: 'NI', flag_url: 'https://flagcdn.com/w320/ni.png' },
  { continent_code: 'NA', name: 'Panama', code: 'PA', flag_url: 'https://flagcdn.com/w320/pa.png' },
  { continent_code: 'NA', name: 'Saint Kitts and Nevis', code: 'KN', flag_url: 'https://flagcdn.com/w320/kn.png' },
  { continent_code: 'NA', name: 'Saint Lucia', code: 'LC', flag_url: 'https://flagcdn.com/w320/lc.png' },
  { continent_code: 'NA', name: 'Saint Vincent and the Grenadines', code: 'VC', flag_url: 'https://flagcdn.com/w320/vc.png' },
  { continent_code: 'NA', name: 'Trinidad and Tobago', code: 'TT', flag_url: 'https://flagcdn.com/w320/tt.png' },
  { continent_code: 'NA', name: 'United States', code: 'US', flag_url: 'https://flagcdn.com/w320/us.png' },

  // SOUTH AMERICA (12 paesi)
  { continent_code: 'SA', name: 'Argentina', code: 'AR', flag_url: 'https://flagcdn.com/w320/ar.png' },
  { continent_code: 'SA', name: 'Bolivia', code: 'BO', flag_url: 'https://flagcdn.com/w320/bo.png' },
  { continent_code: 'SA', name: 'Brazil', code: 'BR', flag_url: 'https://flagcdn.com/w320/br.png' },
  { continent_code: 'SA', name: 'Chile', code: 'CL', flag_url: 'https://flagcdn.com/w320/cl.png' },
  { continent_code: 'SA', name: 'Colombia', code: 'CO', flag_url: 'https://flagcdn.com/w320/co.png' },
  { continent_code: 'SA', name: 'Ecuador', code: 'EC', flag_url: 'https://flagcdn.com/w320/ec.png' },
  { continent_code: 'SA', name: 'Guyana', code: 'GY', flag_url: 'https://flagcdn.com/w320/gy.png' },
  { continent_code: 'SA', name: 'Paraguay', code: 'PY', flag_url: 'https://flagcdn.com/w320/py.png' },
  { continent_code: 'SA', name: 'Peru', code: 'PE', flag_url: 'https://flagcdn.com/w320/pe.png' },
  { continent_code: 'SA', name: 'Suriname', code: 'SR', flag_url: 'https://flagcdn.com/w320/sr.png' },
  { continent_code: 'SA', name: 'Uruguay', code: 'UY', flag_url: 'https://flagcdn.com/w320/uy.png' },
  { continent_code: 'SA', name: 'Venezuela', code: 'VE', flag_url: 'https://flagcdn.com/w320/ve.png' },

  // OCEANIA (14 paesi)
  { continent_code: 'OC', name: 'Australia', code: 'AU', flag_url: 'https://flagcdn.com/w320/au.png' },
  { continent_code: 'OC', name: 'Fiji', code: 'FJ', flag_url: 'https://flagcdn.com/w320/fj.png' },
  { continent_code: 'OC', name: 'Kiribati', code: 'KI', flag_url: 'https://flagcdn.com/w320/ki.png' },
  { continent_code: 'OC', name: 'Marshall Islands', code: 'MH', flag_url: 'https://flagcdn.com/w320/mh.png' },
  { continent_code: 'OC', name: 'Micronesia', code: 'FM', flag_url: 'https://flagcdn.com/w320/fm.png' },
  { continent_code: 'OC', name: 'Nauru', code: 'NR', flag_url: 'https://flagcdn.com/w320/nr.png' },
  { continent_code: 'OC', name: 'New Zealand', code: 'NZ', flag_url: 'https://flagcdn.com/w320/nz.png' },
  { continent_code: 'OC', name: 'Palau', code: 'PW', flag_url: 'https://flagcdn.com/w320/pw.png' },
  { continent_code: 'OC', name: 'Papua New Guinea', code: 'PG', flag_url: 'https://flagcdn.com/w320/pg.png' },
  { continent_code: 'OC', name: 'Samoa', code: 'WS', flag_url: 'https://flagcdn.com/w320/ws.png' },
  { continent_code: 'OC', name: 'Solomon Islands', code: 'SB', flag_url: 'https://flagcdn.com/w320/sb.png' },
  { continent_code: 'OC', name: 'Tonga', code: 'TO', flag_url: 'https://flagcdn.com/w320/to.png' },
  { continent_code: 'OC', name: 'Tuvalu', code: 'TV', flag_url: 'https://flagcdn.com/w320/tv.png' },
  { continent_code: 'OC', name: 'Vanuatu', code: 'VU', flag_url: 'https://flagcdn.com/w320/vu.png' }
];

// 🔧 Funzioni helper
const makeXataRequest = async (tableName: string, data: any[]) => {
  const endpoint = `${process.env.XATA_DATABASE_URL}/tables/${tableName}/bulk`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.XATA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      operations: data.map(record => ({
        insert: record
      }))
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Xata ${tableName} insert failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

// 🚀 API Endpoint
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Avvio popolamento database base...');

    // Verifica environment variables
    if (!process.env.XATA_API_KEY || !process.env.XATA_DATABASE_URL) {
      return NextResponse.json(
        { error: 'XATA_API_KEY e XATA_DATABASE_URL devono essere configurati' },
        { status: 500 }
      );
    }

    const results = {
      continents: { inserted: 0, errors: [] as string[] },
      countries: { inserted: 0, errors: [] as string[] }
    };

    // 1. Popolare continenti
    console.log('🌍 Inserimento continenti...');
    try {
      const continentsResult = await makeXataRequest('continents', CONTINENTS);
      results.continents.inserted = continentsResult.results?.length || 0;
      console.log(`✅ ${results.continents.inserted} continenti inseriti`);
    } catch (error: any) {
      results.continents.errors.push(error.message);
      console.error('❌ Errore continenti:', error.message);
    }

    // Pausa per evitare rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Popolare paesi
    console.log('🏳️ Inserimento paesi...');
    try {
      // Dividi in chunk per evitare timeout (50 paesi per volta)
      const chunkSize = 50;
      let totalInserted = 0;

      for (let i = 0; i < COUNTRIES.length; i += chunkSize) {
        const chunk = COUNTRIES.slice(i, i + chunkSize);
        console.log(`   📦 Chunk ${Math.floor(i/chunkSize) + 1}: ${chunk.length} paesi`);
        
        const chunkResult = await makeXataRequest('countries', chunk);
        const insertedCount = chunkResult.results?.length || 0;
        totalInserted += insertedCount;
        
        console.log(`   ✅ ${insertedCount} paesi inseriti in questo chunk`);
        
        // Pausa tra chunks
        if (i + chunkSize < COUNTRIES.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      results.countries.inserted = totalInserted;
      console.log(`✅ Totale ${totalInserted} paesi inseriti`);
    } catch (error: any) {
      results.countries.errors.push(error.message);
      console.error('❌ Errore paesi:', error.message);
    }

    // 📊 Risultato finale
    const summary = {
      success: results.continents.errors.length === 0 && results.countries.errors.length === 0,
      continents_inserted: results.continents.inserted,
      countries_inserted: results.countries.inserted,
      total_errors: results.continents.errors.length + results.countries.errors.length,
      errors: [...results.continents.errors, ...results.countries.errors]
    };

    console.log('🎉 Popolamento completato!');
    console.log(`📈 Statistiche: ${summary.continents_inserted} continenti, ${summary.countries_inserted} paesi`);

    return NextResponse.json({
      success: true,
      message: 'Database popolato con successo!',
      results: summary
    });

  } catch (error: any) {
    console.error('❌ Errore generale:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore durante il popolamento database',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// 📖 Info endpoint (GET)
export async function GET() {
  return NextResponse.json({
    info: 'Travel Planner - Base Data Population API',
    data: {
      continents: CONTINENTS.length,
      countries: COUNTRIES.length,
      breakdown: {
        Europe: COUNTRIES.filter(c => c.continent_code === 'EU').length,
        Asia: COUNTRIES.filter(c => c.continent_code === 'AS').length,
        Africa: COUNTRIES.filter(c => c.continent_code === 'AF').length,
        'North America': COUNTRIES.filter(c => c.continent_code === 'NA').length,
        'South America': COUNTRIES.filter(c => c.continent_code === 'SA').length,
        Oceania: COUNTRIES.filter(c => c.continent_code === 'OC').length
      }
    },
    usage: {
      method: 'POST',
      url: '/api/admin/populate-base',
      description: 'Popola il database con continenti e paesi base'
    }
  });
}