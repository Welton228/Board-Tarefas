
//react
import React from 'react'

//next libs
import Head from 'next/head'
const dashboard = () => {
  return (
    <div>
        <Head>
            <title>Meu painel de tarefas</title>
        </Head>
        <h1>Página painel</h1>
    </div>
  )
}

export default dashboard

// export const getServerSideProps: GetServerSideProps = async ({ req}) => {
// console.log('buscando pelo server side props')
//   return {
//     props: {
//       }
//   }
// }